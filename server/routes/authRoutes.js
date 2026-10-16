// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// Authentication Routes - Version 1.1
// ==================================================

// --------------------------------------------------
// STEP 1: IMPORT REQUIRED MODULES
// --------------------------------------------------

// Express Router manages authentication endpoints.
const express = require("express");

// MySQL connection pool.
const pool = require("../db");

// Argon2id password verification utility.
const { verifyPassword } = require("../utils/passwordUtils");

// JSON Web Token library.
const jwt = require("jsonwebtoken");

// --------------------------------------------------
// JWT AUTHENTICATION MIDDLEWARE
// --------------------------------------------------
// Used to protect routes that require a valid login.
// --------------------------------------------------

const { authenticateToken } = require("../middleware/authMiddleware");

// --------------------------------------------------
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// --------------------------------------------------
// Checks whether an authenticated user has
// permission to access a protected route.
// --------------------------------------------------

const { authorizeRoles } = require("../middleware/roleMiddleware");

// Create our authentication router.
const router = express.Router();

// --------------------------------------------------
// STEP 2: AUTHENTICATION ROUTER TEST
// --------------------------------------------------
// GET /api/auth/test
//
// Temporary development endpoint.

router.get("/test", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Authentication router is working"
    });
});

// --------------------------------------------------
// STEP 3: USER LOGIN ENDPOINT
// --------------------------------------------------
// POST /api/auth/login
//
// Expected JSON request:
// {
//     "username": "example",
//     "password": "example-password"
// }
//
// SECURITY:
// Never return passwords or password hashes.

router.post("/login", async (req, res) => {

    try {

        // ------------------------------------------
        // READ LOGIN CREDENTIALS
        // ------------------------------------------

        const { username, password } = req.body || {};

        // Validate request data.
        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        // ------------------------------------------
        // FIND USER IN MYSQL
        // ------------------------------------------
        // Parameterised queries protect against
        // SQL injection.

        const [users] = await pool.execute(
            `SELECT
                user_id,
                username,
                password_hash,
                role,
                customer_id,
                is_active
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [username.trim()]
        );

        // Generic error avoids revealing whether
        // the username exists.

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const user = users[0];

        // ------------------------------------------
        // VERIFY PASSWORD
        // ------------------------------------------

        const passwordValid = await verifyPassword(
            user.password_hash,
            password
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        // ------------------------------------------
        // CHECK ACCOUNT STATUS
        // ------------------------------------------

        if (!user.is_active) {
            return res.status(403).json({
                message: "Account is inactive"
            });
        }

        // ------------------------------------------
        // GENERATE JWT
        // ------------------------------------------
        // JWT identifies the authenticated user.
        //
        // Token expires after one hour.

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                expiresIn: "1h"
            }
        );

        // ------------------------------------------
        // UPDATE LAST LOGIN TIME
        // ------------------------------------------

        await pool.execute(
            `UPDATE users
             SET last_login_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [user.user_id]
        );

        // ------------------------------------------
        // RETURN SUCCESSFUL LOGIN RESPONSE
        // ------------------------------------------

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                role: user.role,
                customerId: user.customer_id
            }
        });

    } catch (error) {

        // --------------------------------------------------
        // TEMPORARY DEVELOPMENT ERROR DIAGNOSTICS
        // --------------------------------------------------
        // Display the full error object in the backend
        // terminal to help identify the actual problem.
        //
        // IMPORTANT:
        // Never send these details to the frontend.
        // Remove detailed logging before deployment.

// --------------------------------------------------
// LOGIN ERROR LOGGING
// --------------------------------------------------
// Log the error code or message for troubleshooting.
// Do not expose internal database errors to clients.
// --------------------------------------------------

console.error(
    "Login endpoint error:",
    error.code || error.message
);

        return res.status(500).json({
            message: "An internal server error occurred"
        });
    }
});

// --------------------------------------------------
// PROTECTED AUTHENTICATION TEST ROUTE
// --------------------------------------------------
// GET /api/auth/me
//
// Only authenticated users can access this endpoint.
//
// authenticateToken:
// 1. Verifies the JWT.
// 2. Checks the user account in MySQL.
// 3. Attaches the authenticated user to req.user.
//
// The route then returns the authenticated user's
// information without exposing passwords or tokens.
// --------------------------------------------------

router.get("/me", authenticateToken, (req, res) => {
    return res.status(200).json({
        message: "Protected route accessed successfully",
        user: req.user,
    });
});
// ==================================================
// ROLE-BASED AUTHORIZATION TEST ROUTES
// ==================================================
// These endpoints verify that our RBAC middleware
// correctly restricts access according to user roles.
//
// IMPORTANT:
// authenticateToken must run FIRST.
// authorizeRoles must run SECOND.
// ==================================================


// --------------------------------------------------
// ADMIN-ONLY TEST ROUTE
// --------------------------------------------------
// GET /api/auth/admin-test
//
// Only users with the ADMIN role are permitted.
// --------------------------------------------------

router.get(
    "/admin-test",

    // Step 1: Verify JWT and identify the user.
    authenticateToken,

    // Step 2: Allow ADMIN users only.
    authorizeRoles("ADMIN"),

    // Step 3: Return confirmation.
    (req, res) => {
        return res.status(200).json({
            message: "ADMIN authorization successful",
            role: req.user.role,
        });
    }
);


// --------------------------------------------------
// MANAGER-ONLY TEST ROUTE
// --------------------------------------------------
// GET /api/auth/manager-test
//
// Only users with the MANAGER role are permitted.
// --------------------------------------------------

router.get(
    "/manager-test",

    // Step 1: Verify JWT and identify the user.
    authenticateToken,

    // Step 2: Allow MANAGER users only.
    authorizeRoles("MANAGER"),

    // Step 3: Return confirmation.
    (req, res) => {
        return res.status(200).json({
            message: "MANAGER authorization successful",
            role: req.user.role,
        });
    }
);

// --------------------------------------------------
// STEP 4: EXPORT ROUTER
// --------------------------------------------------

module.exports = router;