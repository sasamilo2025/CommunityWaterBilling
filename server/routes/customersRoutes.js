// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CUSTOMER MANAGEMENT ROUTES
// ==================================================
//
// PURPOSE:
// Provide protected API endpoints for managing
// customer information.
//
// ROLE PERMISSIONS:
// ADMIN   - Customer management.
// MANAGER - Read-only access.
// CUSTOMER - Own information only.
//
// ==================================================

"use strict";

const express = require("express");

// MySQL database connection pool.
const pool = require("../db");

// JWT authentication middleware.
const { authenticateToken } = require(
    "../middleware/authMiddleware"
);

// Role-based authorization middleware.
const { authorizeRoles } = require(
    "../middleware/roleMiddleware"
);

// Create the customer router.
const router = express.Router();

// ==================================================
// GET ALL CUSTOMERS
// ==================================================
//
// ENDPOINT:
// GET /api/customers
//
// PERMISSIONS:
// ADMIN and MANAGER only.
//
// SECURITY:
// 1. Verify the JWT.
// 2. Check the user's role.
// 3. Retrieve customer records from MySQL.
//
// ==================================================

router.get(
    "/",

    // Verify authentication.
    authenticateToken,

    // Only ADMIN and MANAGER may view all customers.
    authorizeRoles("ADMIN", "MANAGER"),

    async (req, res) => {
        try {

            // Retrieve customer records.
            // Parameterized inputs will be used for
            // future queries that accept user values.

            const [customers] = await pool.execute(
                `SELECT
                    customer_id,
                    customer_no,
                    first_name,
                    last_name,
                    address,
                    phone,
                    email,
                    status,
                    created_at
                FROM customers
                ORDER BY customer_id ASC`
            );

            // Return customer records as JSON.
            return res.status(200).json({
                message: "Customers retrieved successfully",
                count: customers.length,
                customers
            });

        } catch (error) {

            // Log diagnostic details on the server.
            console.error(
                "Get customers error:",
                error.code || error.message
            );

            // Do not expose database errors to clients.
            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// CREATE NEW CUSTOMER
// POST /api/customers
// ADMIN ONLY
// ==================================================

router.post(
    "/",

    // Verify the user's JWT.
    authenticateToken,

    // Only ADMIN can create customers.
    authorizeRoles("ADMIN"),

    async (req, res) => {
        try {

            // Extract customer information from the request.
            const {
                customer_no,
                first_name,
                last_name,
                address,
                phone,
                email
            } = req.body;

            // Validate required fields.
            if (
                !customer_no ||
                !first_name ||
                !last_name ||
                !address
            ) {
                return res.status(400).json({
                    message: "Customer number, first name, last name and address are required"
                });
            }

            // Validate customer number format: ABC12.
            if (!/^[A-Z]{3}[0-9]{2}$/.test(customer_no)) {
                return res.status(400).json({
                    message: "Customer number must follow format ABC12"
                });
            }

            // Insert the customer using a parameterized query.
            // This helps prevent SQL injection.
            const [result] = await pool.execute(
                `INSERT INTO customers
                (
                    customer_no,
                    first_name,
                    last_name,
                    address,
                    phone,
                    email
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    customer_no,
                    first_name,
                    last_name,
                    address,
                    phone || null,
                    email || null
                ]
            );

            // Return the newly created customer's ID.
            return res.status(201).json({
                message: "Customer created successfully",
                customer_id: result.insertId
            });

        } catch (error) {

            // Handle duplicate customer numbers.
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Customer number already exists"
                });
            }

            // Log errors without exposing database details.
            console.error(
                "Create customer error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// UPDATE EXISTING CUSTOMER
// ==================================================
//
// ENDPOINT:
// PUT /api/customers/:id
//
// PERMISSIONS:
// ADMIN ONLY
//
// PURPOSE:
// Update an existing customer's information.
//
// SECURITY:
// 1. Authenticate the JWT.
// 2. Verify ADMIN authorization.
// 3. Validate all customer information.
// 4. Use parameterized SQL.
// 5. Protect against duplicate customer numbers.
//
// ==================================================

router.put(
    "/:id",

    // Verify the user's authentication token.
    authenticateToken,

    // Only ADMIN can update customer records.
    authorizeRoles("ADMIN"),

    async (req, res) => {
        try {

            // ------------------------------------------
            // STEP 1 — VALIDATE CUSTOMER ID
            // ------------------------------------------

            const id = req.params.id;

            // Customer IDs must be positive integers.
            if (!/^[1-9][0-9]*$/.test(id) ||
                !Number.isSafeInteger(Number(id))) {

                return res.status(400).json({
                    message: "Invalid customer ID"
                });
            }

            // ------------------------------------------
            // STEP 2 — EXTRACT CUSTOMER INFORMATION
            // ------------------------------------------

            const {
                customer_no,
                first_name,
                last_name,
                address,
                phone,
                email
            } = req.body || {};

            // ------------------------------------------
            // STEP 3 — VALIDATE REQUIRED FIELDS
            // ------------------------------------------

            if (
                typeof customer_no !== "string" ||
                typeof first_name !== "string" ||
                typeof last_name !== "string" ||
                typeof address !== "string" ||
                !first_name.trim() ||
                !last_name.trim() ||
                !address.trim()
            ) {
                return res.status(400).json({
                    message:
                        "Customer number, first name, last name and address are required"
                });
            }

            // ------------------------------------------
            // STEP 4 — VALIDATE CUSTOMER NUMBER
            // ------------------------------------------

            if (!/^[A-Z]{3}[0-9]{2}$/.test(customer_no)) {

                return res.status(400).json({
                    message:
                        "Customer number must follow format ABC12"
                });
            }

            // ------------------------------------------
            // STEP 5 — VALIDATE FIELD LENGTHS
            // ------------------------------------------

            if (
                first_name.trim().length > 50 ||
                last_name.trim().length > 50 ||
                address.trim().length > 255
            ) {
                return res.status(400).json({
                    message: "One or more fields exceed their maximum length"
                });
            }

            // ------------------------------------------
            // STEP 6 — VALIDATE OPTIONAL FIELDS
            // ------------------------------------------

            if (
                (phone != null && typeof phone !== "string") ||
                (email != null && typeof email !== "string")
            ) {
                return res.status(400).json({
                    message: "Phone and email must be text values"
                });
            }

            const cleanPhone = phone?.trim() || null;
            const cleanEmail = email?.trim() || null;

            if (
                (cleanPhone && cleanPhone.length > 20) ||
                (cleanEmail && (
                    cleanEmail.length > 100 ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
                ))
            ) {
                return res.status(400).json({
                    message: "Invalid phone or email information"
                });
            }

            // ------------------------------------------
            // STEP 7 — UPDATE MYSQL RECORD
            // ------------------------------------------

            // The WHERE clause ensures that only
            // the requested customer is updated.

            const [result] = await pool.execute(
                `UPDATE customers
                 SET
                    customer_no = ?,
                    first_name = ?,
                    last_name = ?,
                    address = ?,
                    phone = ?,
                    email = ?
                 WHERE customer_id = ?`,
                [
                    customer_no,
                    first_name.trim(),
                    last_name.trim(),
                    address.trim(),
                    cleanPhone,
                    cleanEmail,
                    id
                ]
            );

            // ------------------------------------------
            // STEP 8 — CHECK WHETHER CUSTOMER EXISTS
            // ------------------------------------------

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            // ------------------------------------------
            // STEP 9 — RETURN SUCCESS RESPONSE
            // ------------------------------------------

            return res.status(200).json({
                message: "Customer updated successfully",
                customer_id: Number(id)
            });

        } catch (error) {

            // Handle duplicate customer numbers.
            if (error.code === "ER_DUP_ENTRY") {

                return res.status(409).json({
                    message: "Customer number already exists"
                });
            }

            // Log technical details on the server only.
            console.error(
                "Update customer error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// MISSION 25 — CUSTOMER DEACTIVATION / REACTIVATION
// ==================================================
//
// METHOD: PATCH
// ENDPOINT: /api/customers/:id/status
//
// PURPOSE:
// Change a customer's status without deleting
// their personal information or financial history.
//
// SECURITY:
// Only authenticated ADMIN users may change status.
//
// VALID STATUS VALUES:
// ACTIVE   — Customer currently active.
// INACTIVE — Customer deactivated.
//
// ==================================================

router.patch(
    "/:id/status",

    authenticateToken,

    authorizeRoles("ADMIN"),

    async (req, res) => {
        try {

            // ------------------------------------------
            // STEP 1 — READ CUSTOMER ID AND NEW STATUS
            // ------------------------------------------

            const { id } = req.params;
            const { status } = req.body;

            // ------------------------------------------
            // STEP 2 — VALIDATE CUSTOMER ID
            // ------------------------------------------

            const customerId = Number(id);

            if (
                !Number.isSafeInteger(customerId) ||
                customerId <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid customer ID"
                });
            }

            // ------------------------------------------
            // STEP 3 — VALIDATE REQUESTED STATUS
            // ------------------------------------------

            if (!["ACTIVE", "INACTIVE"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be ACTIVE or INACTIVE"
                });
            }

            // ------------------------------------------
            // STEP 4 — UPDATE CUSTOMER STATUS IN MYSQL
            // ------------------------------------------
            //
            // IMPORTANT:
            // We use UPDATE instead of DELETE.
            //
            // Customer details, meters, readings,
            // invoices and payments are preserved.
            //
            // Parameter placeholders (?) protect
            // against SQL injection.
            // ------------------------------------------

            const [result] = await pool.execute(
                `UPDATE customers
                 SET status = ?
                 WHERE customer_id = ?`,
                [status, customerId]
            );

            // ------------------------------------------
            // STEP 5 — CHECK WHETHER CUSTOMER EXISTS
            // ------------------------------------------

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            // ------------------------------------------
            // STEP 6 — RETURN SUCCESS RESPONSE
            // ------------------------------------------

            return res.status(200).json({
                message:
                    status === "ACTIVE"
                        ? "Customer reactivated successfully"
                        : "Customer deactivated successfully",

                customer_id: customerId,
                status
            });

        } catch (error) {

            // Log technical details on the server.
            console.error(
                "Customer status update error:",
                error.code || error.message
            );

            return res.status(500).json({
                message: "An internal server error occurred"
            });
        }
    }
);

// ==================================================
// EXPORT CUSTOMER ROUTER
// ==================================================

module.exports = router;