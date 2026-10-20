// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// MANAGEMENT REPORTS API
// ==================================================
//
// GET /api/reports/monthly-customers
//
// PURPOSE:
// Retrieve monthly consumption and invoice charges
// for July, August and September 2026.
//
// SECURITY:
// ADMIN and MANAGER may view management reports.
// CUSTOMER cannot access other customers' records.
//
// DATA FLOW:
// React → Express → JWT → MySQL → JSON → React
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
// MONTHLY CUSTOMER CONSUMPTION AND COST REPORT
// ==================================================

router.get(
    "/monthly-customers",

    authenticateToken,

    authorizeRoles("ADMIN", "MANAGER"),

    async (req, res) => {

        try {

            // Aggregate across all meters owned by
            // each customer, grouped by billing month.
            //
            // Use the invoice's stored consumption and
            // total_amount for financial consistency.

            const [rows] = await pool.execute(
                `SELECT
                    c.customer_no,
                    c.first_name,
                    c.last_name,

                    DATE_FORMAT(
                        r.billing_month,
                        '%Y-%m'
                    ) AS report_month,

                    COUNT(*) AS invoice_count,

                    SUM(b.consumption_m3) AS consumption_m3,

                    SUM(b.total_amount) AS total_cost

                 FROM bills AS b

                 INNER JOIN meter_readings AS r
                    ON b.reading_id = r.reading_id

                 INNER JOIN meters AS m
                    ON r.meter_serial = m.meter_serial

                 INNER JOIN customers AS c
                    ON m.customer_id = c.customer_id

                 WHERE r.reading_type = 'MONTHLY'

                   AND r.billing_month >= '2026-07-01'

                   AND r.billing_month < '2026-10-01'

                 GROUP BY
                    c.customer_id,
                    c.customer_no,
                    c.first_name,
                    c.last_name,
                    r.billing_month

                 ORDER BY
                    c.customer_no,
                    r.billing_month`
            );

            return res.status(200).json({

                message:
                    "Monthly customer report retrieved successfully",

                period: {
                    from: "2026-07",
                    to: "2026-09"
                },

                count: rows.length,

                report: rows
            });

        } catch (error) {

            console.error(
                "Monthly report error:",
                error.code || error.message
            );

            return res.status(500).json({
                message:
                    "Unable to generate monthly customer report"
            });
        }
    }
);


module.exports = router;