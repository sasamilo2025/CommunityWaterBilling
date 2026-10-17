// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER MANAGEMENT ROUTES
// ==================================================
//
// PURPOSE:
// Provide protected API endpoints for water meters.
//
// ROLE PERMISSIONS:
// ADMIN   - Register and maintain meters.
// MANAGER - Read-only access.
// CUSTOMER - View their own meters only.
//
// ==================================================

"use strict";

// Import Express.
const express = require("express");

// Import the MySQL connection pool.
const pool = require("../db");

// Import JWT authentication middleware.
const { authenticateToken } = require(
    "../middleware/authMiddleware"
);

// Import role-based authorization middleware.
const { authorizeRoles } = require(
    "../middleware/roleMiddleware"
);

// Create the meter router.
const router = express.Router();


// ==================================================
// GET ALL METERS
// ==================================================
//
// ENDPOINT:
// GET /api/meters
//
// PERMISSIONS:
// ADMIN and MANAGER only.
//
// SECURITY:
// 1. Verify JWT authentication.
// 2. Verify the user's role.
// 3. Retrieve meter records from MySQL.
//
// ==================================================

router.get(
    "/",

    // Verify the user's authentication token.
    authenticateToken,

    // Restrict access to ADMIN and MANAGER.
    authorizeRoles("ADMIN", "MANAGER"),

    async (req, res) => {

        try {

            // Retrieve meters and associated customers.
            // LEFT JOIN is not necessary because the
            // customer relationship is mandatory.
            // const [meters] = await pool.execute(
                `SELECT
                    m.meter_serial,
                    m.customer_id,
                    c.customer_no,
                    c.first_name,
                    c.last_name,

                    -- Customer account status from customers table.
                    c.status AS customer_status,

                    m.location,

                    -- Physical meter status from meters table.
                    -- Keep the original field name for React.
                    m.status,

                    m.installed_at,
                    m.created_at

                FROM meters AS m

                INNER JOIN customers AS c
                    ON m.customer_id = c.customer_id

                ORDER BY m.meter_serial ASC`
            );

            // Return the meter records as JSON.
            return res.status(200).json({
                message: "Meters retrieved successfully",
                count: meters.length,
                meters
            });

        } catch (error) {

            // Log the error for backend diagnosis.
            console.error(
                "Get meters error:",
                error.code || error.message
            );

            // Return a safe error response.
            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// REGISTER NEW WATER METER
// ==================================================
//
// ENDPOINT:
// POST /api/meters
//
// PERMISSIONS:
// ADMIN ONLY.
//
// PURPOSE:
// Register a meter and assign it to an existing
// customer without modifying existing meter records.
//
// ==================================================

router.post(
    "/",

    // Require a valid JWT.
    authenticateToken,

    // Only ADMIN can register new meters.
    authorizeRoles("ADMIN"),

    async (req, res) => {

        try {

            // Retrieve values submitted by the form.
            const {
                meter_serial,
                customer_id,
                location,
                status,
                installed_at
            } = req.body;

            // ------------------------------------------
            // VALIDATE METER SERIAL NUMBER
            // ------------------------------------------
            // Accept 1234-5678 or 12345678.
            // Store only the eight digits in MySQL.

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
            // VALIDATE CUSTOMER ID
            // ------------------------------------------

            if (
                !Number.isSafeInteger(Number(customer_id)) ||
                Number(customer_id) <= 0
            ) {
                return res.status(400).json({
                    message: "Please select a valid customer"
                });
            }

            // ------------------------------------------
            // VALIDATE LOCATION
            // ------------------------------------------

            if (
                typeof location !== "string" ||
                location.trim() === "" ||
                location.trim().length > 255
            ) {
                return res.status(400).json({
                    message: "Meter location is required (maximum 255 characters)"
                });
            }

            // ------------------------------------------
            // VALIDATE METER STATUS
            // ------------------------------------------

            const meterStatus = status || "ACTIVE";

            if (!["ACTIVE", "INACTIVE"].includes(meterStatus)) {
                return res.status(400).json({
                    message: "Meter status must be ACTIVE or INACTIVE"
                });
            }

            // ------------------------------------------
            // VALIDATE INSTALLATION DATE
            // ------------------------------------------
            // Accept an optional YYYY-MM-DD date.

            const installationDate = installed_at || null;

            if (
                installationDate !== null &&
                (
                    typeof installationDate !== "string" ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(installationDate)
                )
            ) {
                return res.status(400).json({
                    message: "Installation date must use YYYY-MM-DD format"
                });
            }

            // ------------------------------------------
            // VERIFY CUSTOMER EXISTS
            // ------------------------------------------

            const [customers] = await pool.execute(
                `SELECT customer_id
                 FROM customers
                 WHERE customer_id = ?`,
                [Number(customer_id)]
            );

            if (customers.length === 0) {
                return res.status(404).json({
                    message: "Selected customer does not exist"
                });
            }

            // ------------------------------------------
            // INSERT NEW METER
            // ------------------------------------------
            // Parameterized SQL protects against
            // SQL injection.

            await pool.execute(
                `INSERT INTO meters
                (
                    meter_serial,
                    customer_id,
                    location,
                    status,
                    installed_at
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    normalizedSerial,
                    Number(customer_id),
                    location.trim(),
                    meterStatus,
                    installationDate
                ]
            );

            // ------------------------------------------
            // SUCCESS RESPONSE
            // ------------------------------------------

            return res.status(201).json({
                message: "Meter registered successfully",
                meter_serial: normalizedSerial
            });

        } catch (error) {

            // Duplicate meter number.
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Meter number already exists"
                });
            }

            // Customer was removed before insertion.
            if (error.code === "ER_NO_REFERENCED_ROW_2") {
                return res.status(404).json({
                    message: "Selected customer does not exist"
                });
            }

            // Log technical details on the server only.
            console.error(
                "Register meter error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// EXPORT METER ROUTER
// ==================================================

module.exports = router;