// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER READINGS ROUTES
// ==================================================
//
// PURPOSE:
// Retrieve and manage water meter readings.
//
// ROLE PERMISSIONS:
// ADMIN   - Manage meter readings.
// MANAGER - View meter readings.
// CUSTOMER - View own readings (future endpoint).
//
// ==================================================

"use strict";

// Import Express.
const express = require("express");

// Import MySQL connection pool.
const pool = require("../db");

// Import JWT authentication middleware.
const { authenticateToken } = require(
    "../middleware/authMiddleware"
);

// Import role authorization middleware.
const { authorizeRoles } = require(
    "../middleware/roleMiddleware"
);

// Create Express router.
const router = express.Router();


// ==================================================
// GET ALL METER READINGS
// ==================================================
//
// ENDPOINT:
// GET /api/readings
//
// PERMISSIONS:
// ADMIN and MANAGER only.
//
// ==================================================

router.get(
    "/",

    // Verify JWT authentication.
    authenticateToken,

    // Restrict access to authorized roles.
    authorizeRoles("ADMIN", "MANAGER"),

    async (req, res) => {

        try {

            // Retrieve meter readings with customer details.
            const [readings] = await pool.execute(
                `SELECT
                    r.reading_id,
                    r.meter_serial,
                    r.billing_month,
                    r.reading_date,
                    r.reading_type,
                    r.reading_value,

                    c.customer_no,
                    c.first_name,
                    c.last_name

                FROM meter_readings AS r

                INNER JOIN meters AS m
                    ON r.meter_serial = m.meter_serial

                INNER JOIN customers AS c
                    ON m.customer_id = c.customer_id

                ORDER BY
                    r.meter_serial ASC,
                    r.reading_date DESC,
                    r.reading_id DESC`
            );

            // Return readings to the frontend.
            return res.status(200).json({
                message: "Meter readings retrieved successfully",
                count: readings.length,
                readings
            });

        } catch (error) {

            // Log database errors on the server.
            console.error(
                "Get readings error:",
                error.code || error.message
            );

            // Avoid exposing internal database details.
            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// REGISTER INITIAL METER READING
// ==================================================
//
// ENDPOINT:
// POST /api/readings/initial
//
// PERMISSIONS:
// ADMIN only.
//
// PURPOSE:
// Record the opening reading when a meter is
// installed.
//
// BUSINESS RULES:
// - One INITIAL reading per meter.
// - Reading date must match installation date.
// - Reading value must be a non-negative integer.
// - Existing monthly readings must not conflict.
//
// ==================================================

router.post(
    "/initial",

    // Verify the user's JWT.
    authenticateToken,

    // Only ADMIN may register meter readings.
    authorizeRoles("ADMIN"),

    async (req, res) => {

        // A dedicated connection allows us to use
        // a transaction and lock the selected meter.
        let connection;

        try {

            // ------------------------------------------
            // READ REQUEST VALUES
            // ------------------------------------------

            const {
                meter_serial,
                reading_date,
                reading_value
            } = req.body || {};

            // ------------------------------------------
            // VALIDATE METER NUMBER
            // ------------------------------------------

            if (typeof meter_serial !== "string") {
                return res.status(400).json({
                    message: "Meter number is required"
                });
            }

            // Accept 1234-5678 or 12345678.
            const normalizedSerial =
                meter_serial.replace("-", "");

            if (!/^[0-9]{8}$/.test(normalizedSerial)) {
                return res.status(400).json({
                    message: "Meter number must contain exactly 8 digits"
                });
            }

            // ------------------------------------------
            // VALIDATE READING DATE
            // ------------------------------------------

            if (
                typeof reading_date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
            ) {
                return res.status(400).json({
                    message: "Reading date must use YYYY-MM-DD format"
                });
            }

            // Verify that the date actually exists.
            const parsedDate = new Date(
                `${reading_date}T00:00:00Z`
            );

            if (
                Number.isNaN(parsedDate.getTime()) ||
                parsedDate.toISOString().slice(0, 10) !==
                    reading_date
            ) {
                return res.status(400).json({
                    message: "Reading date is invalid"
                });
            }

            // ------------------------------------------
            // VALIDATE READING VALUE
            // ------------------------------------------

            // Require a genuine JSON number.
            // Reject negative, fractional and unsafe values.
            if (
                typeof reading_value !== "number" ||
                !Number.isSafeInteger(reading_value) ||
                reading_value < 0 ||
                reading_value > 4294967295
            ) {
                return res.status(400).json({
                    message:
                        "Initial reading must be a non-negative whole number"
                });
            }

            // ------------------------------------------
            // BEGIN DATABASE TRANSACTION
            // ------------------------------------------

            connection = await pool.getConnection();

            await connection.beginTransaction();

            // ------------------------------------------
            // VERIFY AND LOCK METER
            // ------------------------------------------
            // Locking the meter row serializes initial
            // reading registration for this meter.

            const [meters] = await connection.execute(
                `SELECT
                    meter_serial,
                    installed_at,
                    status

                 FROM meters

                 WHERE meter_serial = ?

                 FOR UPDATE`,
                [normalizedSerial]
            );

            if (meters.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    message: "Selected meter does not exist"
                });
            }

            const meter = meters[0];

            // ------------------------------------------
            // REQUIRE INSTALLATION DATE
            // ------------------------------------------

            if (!meter.installed_at) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Meter installation date must be recorded first"
                });
            }

            // ------------------------------------------
            // VERIFY READING DATE
            // ------------------------------------------

            // Our db.js dateStrings configuration
            // preserves SQL DATE values as strings.

            if (meter.installed_at !== reading_date) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Initial reading date must match meter installation date"
                });
            }

            // ------------------------------------------
            // CHECK FOR EXISTING INITIAL READING
            // ------------------------------------------

            const [existingInitial] =
                await connection.execute(
                    `SELECT reading_id

                     FROM meter_readings

                     WHERE meter_serial = ?
                       AND reading_type = 'INITIAL'

                     LIMIT 1`,
                    [normalizedSerial]
                );

            if (existingInitial.length > 0) {

                await connection.rollback();

                return res.status(409).json({
                    message:
                        "An initial reading already exists for this meter"
                });
            }

            // ------------------------------------------
            // CHECK EXISTING MONTHLY READINGS
            // ------------------------------------------
            // The initial reading must not conflict
            // with any existing monthly reading.

            const [monthlyReadings] =
                await connection.execute(
                    `SELECT
                        reading_id,
                        reading_date,
                        reading_value

                     FROM meter_readings

                     WHERE meter_serial = ?
                       AND reading_type = 'MONTHLY'

                     ORDER BY reading_date ASC

                     LIMIT 1`,
                    [normalizedSerial]
                );

            if (monthlyReadings.length > 0) {

                const firstMonthly = monthlyReadings[0];

                // Opening reading must precede the
                // first monthly reading.
                if (
                    reading_date >= firstMonthly.reading_date
                ) {

                    await connection.rollback();

                    return res.status(409).json({
                        message:
                            "Initial reading conflicts with existing monthly reading dates"
                    });
                }

                // Opening value must not exceed the
                // first monthly reading.
                if (
                    reading_value > firstMonthly.reading_value
                ) {

                    await connection.rollback();

                    return res.status(409).json({
                        message:
                            "Initial reading cannot exceed the first monthly reading"
                    });
                }
            }

            // ------------------------------------------
            // CALCULATE BILLING MONTH
            // ------------------------------------------
            // Always use the first day of the month.

            const billingMonth =
                `${reading_date.slice(0, 7)}-01`;

            // ------------------------------------------
            // INSERT INITIAL READING
            // ------------------------------------------

            const [result] = await connection.execute(
                `INSERT INTO meter_readings
                (
                    meter_serial,
                    billing_month,
                    reading_date,
                    reading_type,
                    reading_value
                )
                VALUES (?, ?, ?, 'INITIAL', ?)`,
                [
                    normalizedSerial,
                    billingMonth,
                    reading_date,
                    reading_value
                ]
            );

            // ------------------------------------------
            // COMMIT TRANSACTION
            // ------------------------------------------

            await connection.commit();

            // ------------------------------------------
            // SUCCESS RESPONSE
            // ------------------------------------------

            return res.status(201).json({
                message:
                    "Initial meter reading registered successfully",

                reading: {
                    reading_id: result.insertId,
                    meter_serial: normalizedSerial,
                    billing_month: billingMonth,
                    reading_date,
                    reading_type: "INITIAL",
                    reading_value
                }
            });

        } catch (error) {

            // Roll back any incomplete transaction.
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Initial reading rollback error:",
                        rollbackError.message
                    );
                }
            }

            // Handle duplicate reading constraints.
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message:
                        "An initial reading already exists for this meter"
                });
            }

            // Log technical details on the server.
            console.error(
                "Register initial reading error:",
                error.code || error.message
            );

            return res.status(500).json({
                message:
                    "An internal server error occurred"
            });

        } finally {

            // Always release the database connection.
            if (connection) {
                connection.release();
            }
        }
    }
);

// ==================================================
// REGISTER MONTHLY METER READING
// ==================================================
//
// ENDPOINT:
// POST /api/readings/monthly
//
// PERMISSIONS:
// ADMIN only.
//
// BUSINESS RULES:
// 1. Meter must exist.
// 2. An INITIAL reading must exist.
// 3. ADMIN must confirm the billing month.
// 4. Reading dates must follow chronological order.
// 5. Reading values must not decrease.
// 6. Only one MONTHLY reading per billing month.
// 7. Subsequent billing months must be sequential.
// 8. Save using a database transaction.
//
// ==================================================

router.post(
    "/monthly",

    authenticateToken,

    authorizeRoles("ADMIN"),

    async (req, res) => {

        let connection;

        try {

            // ------------------------------------------
            // STEP 1: READ REQUEST VALUES
            // ------------------------------------------

            const {
                meter_serial,
                billing_month,
                reading_date,
                reading_value,
                billing_month_confirmed
            } = req.body || {};

            // ------------------------------------------
            // STEP 2: VALIDATE METER NUMBER
            // ------------------------------------------

            if (typeof meter_serial !== "string") {
                return res.status(400).json({
                    message: "Meter number is required"
                });
            }

            const normalizedSerial =
                meter_serial.replace("-", "");

            if (!/^[0-9]{8}$/.test(normalizedSerial)) {
                return res.status(400).json({
                    message: "Meter number must contain exactly 8 digits"
                });
            }

            // ------------------------------------------
            // STEP 3: VALIDATE CALENDAR DATES
            // ------------------------------------------
            //
            // Verify both date format and actual
            // calendar validity.
            //
            // This rejects dates such as 2026-02-30.
            // ------------------------------------------

            function validDate(value) {

                if (
                    typeof value !== "string" ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(value)
                ) {
                    return false;
                }

                const parsed = new Date(
                    `${value}T00:00:00Z`
                );

                return (
                    !Number.isNaN(parsed.getTime()) &&
                    parsed.toISOString().slice(0, 10) === value
                );
            }

            if (!validDate(reading_date)) {
                return res.status(400).json({
                    message: "Invalid physical reading date"
                });
            }

            if (
                !validDate(billing_month) ||
                !billing_month.endsWith("-01")
            ) {
                return res.status(400).json({
                    message:
                        "Billing month must be the first day of a valid month"
                });
            }

            // ------------------------------------------
            // STEP 4: REJECT FUTURE PHYSICAL DATES
            // ------------------------------------------
            //
            // Use the server's local calendar date
            // rather than UTC for this comparison.
            // ------------------------------------------

            const now = new Date();

            const today = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0")
            ].join("-");

            if (reading_date > today) {
                return res.status(400).json({
                    message:
                        "Reading date cannot be in the future"
                });
            }

            // ------------------------------------------
            // STEP 5: VALIDATE READING VALUE
            // ------------------------------------------

            if (
                typeof reading_value !== "number" ||
                !Number.isSafeInteger(reading_value) ||
                reading_value < 0 ||
                reading_value > 4294967295
            ) {
                return res.status(400).json({
                    message:
                        "Reading must be a non-negative whole number"
                });
            }

            // ------------------------------------------
            // STEP 6: REQUIRE ADMIN CONFIRMATION
            // ------------------------------------------

            if (billing_month_confirmed !== true) {
                return res.status(400).json({
                    message:
                        "ADMIN must confirm the billing month"
                });
            }

            // ------------------------------------------
            // STEP 7: BEGIN DATABASE TRANSACTION
            // ------------------------------------------

            connection = await pool.getConnection();

            await connection.beginTransaction();

            // Lock meter to prevent simultaneous
            // registrations for the same meter.

            const [meters] = await connection.execute(
                `SELECT meter_serial, installed_at
                 FROM meters
                 WHERE meter_serial = ?
                 FOR UPDATE`,
                [normalizedSerial]
            );

            if (meters.length === 0) {

                await connection.rollback();

                return res.status(404).json({
                    message: "Selected meter does not exist"
                });
            }

            // ------------------------------------------
            // STEP 8: FIND INITIAL READING
            // ------------------------------------------

            const [initialReadings] =
                await connection.execute(
                    `SELECT reading_date, reading_value
                     FROM meter_readings
                     WHERE meter_serial = ?
                       AND reading_type = 'INITIAL'
                     LIMIT 1`,
                    [normalizedSerial]
                );

            if (initialReadings.length === 0) {

                await connection.rollback();

                return res.status(400).json({
                    message:
                        "Register the INITIAL reading first"
                });
            }

            // ------------------------------------------
            // STEP 9: FIND LATEST MONTHLY READING
            // ------------------------------------------

            const [monthlyReadings] =
                await connection.execute(
                    `SELECT
                        billing_month,
                        reading_date,
                        reading_value

                     FROM meter_readings

                     WHERE meter_serial = ?
                       AND reading_type = 'MONTHLY'

                     ORDER BY billing_month DESC

                     LIMIT 1`,
                    [normalizedSerial]
                );

            // ------------------------------------------
            // STEP 10: ESTABLISH PREVIOUS READING
            // ------------------------------------------

            let previousReading = initialReadings[0];

            if (monthlyReadings.length > 0) {

                previousReading = monthlyReadings[0];

                // Calculate the next expected
                // billing month from the latest
                // MONTHLY reading.

                const [year, month] =
                    previousReading.billing_month
                        .split("-")
                        .map(Number);

                const nextMonth = new Date(
                    Date.UTC(year, month, 1)
                ).toISOString().slice(0, 10);

                if (billing_month !== nextMonth) {

                    await connection.rollback();

                    return res.status(409).json({
                        message:
                            `Next billing month must be ${nextMonth}`
                    });
                }

            } else {

                // First MONTHLY reading:
                //
                // ADMIN chooses the first billing
                // period, subject to validation.
                //
                // It cannot precede installation
                // or fall after the reading month.

                const firstAllowedMonth =
                    previousReading.reading_date
                        .slice(0, 7) + "-01";

                const latestAllowedMonth =
                    reading_date.slice(0, 7) + "-01";

                if (
                    billing_month < firstAllowedMonth ||
                    billing_month > latestAllowedMonth
                ) {

                    await connection.rollback();

                    return res.status(400).json({
                        message:
                            "First billing month is outside the permitted reading period"
                    });
                }
            }

            // ------------------------------------------
            // STEP 11: VALIDATE CHRONOLOGICAL ORDER
            // ------------------------------------------

            if (
                reading_date <= previousReading.reading_date
            ) {

                await connection.rollback();

                return res.status(409).json({
                    message:
                        "Reading date must follow the previous reading date"
                });
            }

            // ------------------------------------------
            // STEP 12: PREVENT DECREASING READINGS
            // ------------------------------------------

            if (
                reading_value < previousReading.reading_value
            ) {

                await connection.rollback();

                return res.status(409).json({
                    message:
                        "Monthly reading cannot be lower than the previous reading"
                });
            }

            // ------------------------------------------
            // STEP 13: INSERT MONTHLY READING
            // ------------------------------------------
            //
            // MySQL also enforces uniqueness through
            // uq_meter_month_type.
            // ------------------------------------------

            const [result] = await connection.execute(
                `INSERT INTO meter_readings
                (
                    meter_serial,
                    billing_month,
                    reading_date,
                    reading_type,
                    reading_value
                )
                VALUES (?, ?, ?, 'MONTHLY', ?)`,
                [
                    normalizedSerial,
                    billing_month,
                    reading_date,
                    reading_value
                ]
            );

            // ------------------------------------------
            // STEP 14: COMMIT TRANSACTION
            // ------------------------------------------

            await connection.commit();

            return res.status(201).json({

                message:
                    "Monthly meter reading registered successfully",

                reading: {

                    reading_id: result.insertId,

                    meter_serial: normalizedSerial,

                    billing_month,

                    reading_date,

                    reading_type: "MONTHLY",

                    reading_value,

                    previous_reading:
                        previousReading.reading_value,

                    consumption_m3:
                        reading_value -
                        previousReading.reading_value
                }
            });

        } catch (error) {

            // ------------------------------------------
            // ROLLBACK FAILED TRANSACTIONS
            // ------------------------------------------

            if (connection) {

                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Monthly rollback error:",
                        rollbackError.message
                    );
                }
            }

            // Handle MySQL duplicate constraints.

            if (error.code === "ER_DUP_ENTRY") {

                return res.status(409).json({
                    message:
                        "A reading already exists for this billing month"
                });
            }

            console.error(
                "Monthly reading error:",
                error.code || error.message
            );

            return res.status(500).json({
                message:
                    "An internal server error occurred"
            });

        } finally {

            // Always release the connection.

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