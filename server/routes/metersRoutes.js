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
            const [meters] = await pool.execute(
                `SELECT
                    m.meter_serial,
                    m.customer_id,
                    c.customer_no,
                    c.first_name,
                    c.last_name,
                    m.location,
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
// EXPORT METER ROUTER
// ==================================================

module.exports = router;