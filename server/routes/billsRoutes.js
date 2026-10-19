// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// BILLS / INVOICES API ROUTES
// ==================================================
//
// GET  /api/bills
// POST /api/bills
//
// SECURITY:
// ADMIN   - View and generate invoices.
// MANAGER - View invoices.
//
// BUSINESS RULES:
// - Only MONTHLY readings may be invoiced.
// - One invoice per reading.
// - Previous reading obtained from MySQL.
// - Rate is $0.50 per cubic metre.
// - MySQL calculates consumption and total.
// - MySQL calculates due date (+30 days).
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
// DATE VALIDATION
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
// GET ALL INVOICES
// ==================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("ADMIN", "MANAGER"),

    async (req, res) => {

        try {

            const [bills] = await pool.execute(
                `SELECT
                    b.invoice_number,
                    b.reading_id,
                    b.previous_reading,
                    b.current_reading,
                    b.consumption_m3,
                    b.rate_per_m3,
                    b.total_amount,
                    b.invoice_date,
                    b.payment_due_date,
                    b.status,

                    r.meter_serial,
                    r.billing_month,
                    r.reading_date,

                    c.customer_no,
                    c.first_name,
                    c.last_name

                 FROM bills AS b

                 INNER JOIN meter_readings AS r
                    ON b.reading_id = r.reading_id

                 INNER JOIN meters AS m
                    ON r.meter_serial = m.meter_serial

                 INNER JOIN customers AS c
                    ON m.customer_id = c.customer_id

                 ORDER BY
                    b.invoice_date DESC,
                    b.invoice_number DESC`
            );

            return res.status(200).json({
                message: "Invoices retrieved successfully",
                count: bills.length,
                bills
            });

        } catch (error) {

            console.error(
                "Get bills error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "Unable to retrieve invoices"
            });
        }
    }
);


// ==================================================
// GENERATE CUSTOMER INVOICE
// ==================================================
//
// POST /api/bills
//
// Required JSON:
// {
//   "invoice_number": "1001",
//   "reading_id": 4,
//   "invoice_date": "2026-10-19"
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
            // STEP 1 — VALIDATE REQUEST
            // ------------------------------------------

            const {
                invoice_number,
                reading_id,
                invoice_date
            } = req.body || {};

            // Preserve leading zeros in invoice numbers.
            if (
                typeof invoice_number !== "string" ||
                !/^[0-9]{1,30}$/.test(invoice_number)
            ) {
                return res.status(400).json({
                    message:
                        "Invoice number must contain 1–30 digits"
                });
            }

            if (
                !Number.isSafeInteger(reading_id) ||
                reading_id <= 0
            ) {
                return res.status(400).json({
                    message: "Valid reading ID is required"
                });
            }

            if (!validDate(invoice_date)) {
                return res.status(400).json({
                    message: "Invalid invoice date"
                });
            }

            // ------------------------------------------
            // STEP 2 — BEGIN TRANSACTION
            // ------------------------------------------

            connection = await pool.getConnection();

            await connection.beginTransaction();

            // ------------------------------------------
            // STEP 3 — RETRIEVE SELECTED READING
            // ------------------------------------------

            const [readings] = await connection.execute(
                `SELECT
                    reading_id,
                    meter_serial,
                    billing_month,
                    reading_date,
                    reading_type,
                    reading_value

                 FROM meter_readings

                 WHERE reading_id = ?

                 FOR UPDATE`,
                [reading_id]
            );

            if (readings.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    message: "Meter reading does not exist"
                });
            }

            const reading = readings[0];

            // ------------------------------------------
            // STEP 4 — ONLY MONTHLY READINGS
            // ------------------------------------------

            if (reading.reading_type !== "MONTHLY") {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "INITIAL readings cannot be invoiced"
                });
            }

            // ------------------------------------------
            // STEP 5 — PREVENT DUPLICATE INVOICES
            // ------------------------------------------

            const [existing] = await connection.execute(
                `SELECT invoice_number
                 FROM bills
                 WHERE reading_id = ?
                 LIMIT 1`,
                [reading_id]
            );

            if (existing.length > 0) {

                await connection.rollback();

                return res.status(409).json({
                    message:
                        "An invoice already exists for this reading"
                });
            }

            // ------------------------------------------
            // STEP 6 — RETRIEVE PREVIOUS READING
            // ------------------------------------------
            //
            // Find the most recent earlier physical
            // reading for the selected meter.
            //
            // This supports INITIAL -> MONTHLY and
            // MONTHLY -> MONTHLY calculations.
            // ------------------------------------------

            const [previousRows] =
                await connection.execute(
                    `SELECT
                        reading_id,
                        reading_value,
                        reading_date

                     FROM meter_readings

                     WHERE meter_serial = ?
                       AND reading_date < ?

                     ORDER BY
                        reading_date DESC,
                        reading_id DESC

                     LIMIT 1`,
                    [
                        reading.meter_serial,
                        reading.reading_date
                    ]
                );

            if (previousRows.length === 0) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "A previous reading is required to calculate consumption"
                });
            }

            const previousReading = previousRows[0];

            // ------------------------------------------
            // STEP 7 — VALIDATE CONSUMPTION
            // ------------------------------------------

            if (
                reading.reading_value <
                previousReading.reading_value
            ) {

                await connection.rollback();

                return res.status(409).json({
                    message:
                        "Current reading cannot be lower than previous reading"
                });
            }

            // ------------------------------------------
            // STEP 8 — INSERT INVOICE
            // ------------------------------------------
            //
            // Rate is stored on each invoice.
            //
            // MySQL automatically calculates:
            // consumption_m3
            // total_amount
            // payment_due_date
            // ------------------------------------------

            const ratePerM3 = "0.50";

            await connection.execute(
                `INSERT INTO bills
                (
                    invoice_number,
                    reading_id,
                    previous_reading,
                    current_reading,
                    rate_per_m3,
                    invoice_date,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, 'UNPAID')`,
                [
                    invoice_number,
                    reading_id,
                    previousReading.reading_value,
                    reading.reading_value,
                    ratePerM3,
                    invoice_date
                ]
            );

            // ------------------------------------------
            // STEP 9 — RETRIEVE GENERATED VALUES
            // ------------------------------------------

            const [newBills] = await connection.execute(
                `SELECT
                    invoice_number,
                    reading_id,
                    previous_reading,
                    current_reading,
                    consumption_m3,
                    rate_per_m3,
                    total_amount,
                    invoice_date,
                    payment_due_date,
                    status

                 FROM bills

                 WHERE invoice_number = ?`,
                [invoice_number]
            );

            // ------------------------------------------
            // STEP 10 — COMMIT TRANSACTION
            // ------------------------------------------

            await connection.commit();

            return res.status(201).json({
                message: "Invoice generated successfully",
                bill: newBills[0]
            });

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Invoice rollback error:",
                        rollbackError.message
                    );
                }
            }

            // Duplicate invoice number or reading.
            if (error.code === "ER_DUP_ENTRY") {

                return res.status(409).json({
                    message:
                        "Invoice number or reading already invoiced"
                });
            }

            console.error(
                "Generate invoice error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "Unable to generate invoice"
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