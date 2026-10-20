// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// PAYMENTS API ROUTES
// ==================================================
//
// GET  /api/payments
// POST /api/payments
//
// ADMIN:
// - View and register payments.
//
// MANAGER:
// - View payment history.
//
// SECURITY:
// JWT authentication and role authorization.
//
// FINANCIAL SAFEGUARDS:
// - Unique numeric receipt number.
// - Existing invoice required.
// - Positive payment amount.
// - No overpayments.
// - Transactional invoice status updates.
//
// ==================================================

"use strict";

const express = require("express");
const pool = require("../db");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();


// ==================================================
// VALIDATE SQL DATE
// ==================================================

function validDate(value) {

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
}


// ==================================================
// GET PAYMENT HISTORY
// ==================================================
//
// GET /api/payments
//
// ADMIN and MANAGER only.
//
// ==================================================

router.get(
    "/",

    authenticateToken,

    authorizeRoles("ADMIN", "MANAGER"),

    async (req, res) => {

        try {

            // ==================================================
// RETRIEVE PAYMENT HISTORY WITH REDUCING BALANCES
// ==================================================
//
// MySQL calculates cumulative payments separately
// for each invoice.
//
// Balance B/F:
// Invoice total minus earlier payments.
//
// Balance C/F:
// Invoice total minus payments through this receipt.
//
// Ordering:
// Payment date, followed by numeric receipt number.
//
// NOTE:
// Numeric receipt order is our agreed ordering rule
// for the current demonstration dataset.
// ==================================================

const [payments] = await pool.execute(
    `SELECT
        p.receipt_number,
        p.invoice_number,
        p.payment_date,
        p.amount_paid,

        b.total_amount,
        b.status,

        r.meter_serial,
        r.billing_month,

        c.customer_no,
        c.first_name,
        c.last_name,

        CAST(
            b.total_amount -
            (
                p.running_total - p.amount_paid
            )
            AS DECIMAL(12,2)
        ) AS balance_before_payment,

        CAST(
            b.total_amount - p.running_total
            AS DECIMAL(12,2)
        ) AS balance_after_payment

     FROM (

         SELECT
             receipt_number,
             invoice_number,
             payment_date,
             amount_paid,

             SUM(amount_paid) OVER (
                 PARTITION BY invoice_number
                 ORDER BY
                     payment_date ASC,
                     CAST(receipt_number AS UNSIGNED) ASC,
                     receipt_number ASC
                 ROWS BETWEEN UNBOUNDED PRECEDING
                 AND CURRENT ROW
             ) AS running_total

         FROM payments

     ) AS p

     INNER JOIN bills AS b
         ON p.invoice_number = b.invoice_number

     INNER JOIN meter_readings AS r
         ON b.reading_id = r.reading_id

     INNER JOIN meters AS m
         ON r.meter_serial = m.meter_serial

     INNER JOIN customers AS c
         ON m.customer_id = c.customer_id

     ORDER BY
         p.payment_date DESC,
         CAST(p.receipt_number AS UNSIGNED) DESC,
         p.receipt_number DESC`
);

            return res.status(200).json({
                message: "Payments retrieved successfully",
                count: payments.length,
                payments
            });

        } catch (error) {

            console.error(
                "Get payments error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "Unable to retrieve payments"
            });
        }
    }
);


// ==================================================
// REGISTER CUSTOMER PAYMENT
// ==================================================
//
// POST /api/payments
//
// Example request:
// {
//     "receipt_number": "5001",
//     "invoice_number": "1001",
//     "payment_date": "2026-10-19",
//     "amount_paid": 5.00
// }
//
// ==================================================

router.post(
    "/",

    authenticateToken,

    authorizeRoles("ADMIN"),

    async (req, res) => {

        let connection;

        try {

            // ------------------------------------------
            // STEP 1 — READ AND VALIDATE INPUT
            // ------------------------------------------

            const {
                receipt_number,
                invoice_number,
                payment_date,
                amount_paid
            } = req.body || {};

            if (
                typeof receipt_number !== "string" ||
                !/^[0-9]{1,30}$/.test(receipt_number)
            ) {
                return res.status(400).json({
                    message:
                        "Receipt number must contain 1–30 digits"
                });
            }

            if (
                typeof invoice_number !== "string" ||
                !/^[0-9]{1,30}$/.test(invoice_number)
            ) {
                return res.status(400).json({
                    message: "Valid invoice number is required"
                });
            }

            if (!validDate(payment_date)) {
                return res.status(400).json({
                    message: "Invalid payment date"
                });
            }

            // Convert currency to integer cents.
            // Avoid JavaScript floating-point comparisons.

            if (
                typeof amount_paid !== "number" ||
                !Number.isFinite(amount_paid) ||
                amount_paid <= 0 ||
                !Number.isSafeInteger(
                    Math.round(amount_paid * 100)
                ) ||
                Math.abs(
                    amount_paid * 100 -
                    Math.round(amount_paid * 100)
                ) > 0.000001
            ) {
                return res.status(400).json({
                    message:
                        "Payment amount must be positive with at most two decimal places"
                });
            }

            const paymentCents =
                Math.round(amount_paid * 100);

            // ------------------------------------------
            // STEP 2 — BEGIN TRANSACTION
            // ------------------------------------------

            connection = await pool.getConnection();

            await connection.beginTransaction();

            // ------------------------------------------
            // STEP 3 — LOCK THE INVOICE
            // ------------------------------------------
            //
            // Prevent simultaneous payments from
            // reading the same outstanding balance.
            // ------------------------------------------

            const [invoices] = await connection.execute(
                `SELECT
                    invoice_number,
                    total_amount,
                    invoice_date

                 FROM bills

                 WHERE invoice_number = ?

                 FOR UPDATE`,
                [invoice_number]
            );

            if (invoices.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    message: "Invoice does not exist"
                });
            }

            const invoice = invoices[0];

            // ------------------------------------------
            // STEP 4 — PAYMENT DATE VALIDATION
            // ------------------------------------------

            if (payment_date < invoice.invoice_date) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Payment date cannot precede invoice date"
                });
            }

            // ------------------------------------------
            // STEP 5 — CALCULATE EXISTING PAYMENTS
            // ------------------------------------------

            const [totals] = await connection.execute(
                `SELECT
                    COALESCE(SUM(amount_paid), 0) AS total_paid

                 FROM payments

                 WHERE invoice_number = ?`,
                [invoice_number]
            );

            const totalCents = Math.round(
                Number(invoice.total_amount) * 100
            );

            const paidCents = Math.round(
                Number(totals[0].total_paid) * 100
            );

            const outstandingCents =
                totalCents - paidCents;

            // ------------------------------------------
            // STEP 6 — PREVENT OVERPAYMENT
            // ------------------------------------------

            if (outstandingCents <= 0) {

                await connection.rollback();

                return res.status(409).json({
                    message: "Invoice is already fully paid"
                });
            }

            if (paymentCents > outstandingCents) {

                await connection.rollback();

                return res.status(409).json({
                    message:
                        "Payment exceeds the outstanding balance"
                });
            }

            // ------------------------------------------
            // STEP 7 — INSERT PAYMENT
            // ------------------------------------------

            await connection.execute(
                `INSERT INTO payments
                (
                    receipt_number,
                    invoice_number,
                    payment_date,
                    amount_paid
                )
                VALUES (?, ?, ?, ?)`,
                [
                    receipt_number,
                    invoice_number,
                    payment_date,
                    (paymentCents / 100).toFixed(2)
                ]
            );

            // ------------------------------------------
            // STEP 8 — UPDATE INVOICE STATUS
            // ------------------------------------------

            const newPaidCents =
                paidCents + paymentCents;

            const newStatus =
                newPaidCents === totalCents
                    ? "PAID"
                    : "PARTIAL";

            await connection.execute(
                `UPDATE bills
                 SET status = ?
                 WHERE invoice_number = ?`,
                [newStatus, invoice_number]
            );

            // ------------------------------------------
            // STEP 9 — COMMIT TRANSACTION
            // ------------------------------------------

            await connection.commit();

            return res.status(201).json({

                message: "Payment registered successfully",

                payment: {
                    receipt_number,
                    invoice_number,
                    payment_date,
                    amount_paid: (paymentCents / 100).toFixed(2),
                    total_paid: (newPaidCents / 100).toFixed(2),
                    outstanding_balance:
                        ((totalCents - newPaidCents) / 100).toFixed(2),
                    invoice_status: newStatus
                }
            });

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Payment rollback error:",
                        rollbackError.message
                    );
                }
            }

            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message:
                        "Receipt number already exists"
                });
            }

            console.error(
                "Register payment error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "Unable to register payment"
            });

        } finally {

            if (connection) {
                connection.release();
            }
        }
    }
);


// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;