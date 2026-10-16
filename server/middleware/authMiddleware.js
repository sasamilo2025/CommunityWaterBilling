// --------------------------------------------------
// COMMUNITY WATER BILLING SYSTEM
// JWT AUTHENTICATION MIDDLEWARE
// --------------------------------------------------
// PURPOSE:
// Protect API routes by verifying JWT access tokens.
//
// HOW IT WORKS:
// 1. Read the Authorization request header.
// 2. Extract the Bearer token.
// 3. Verify the JWT signature and expiration.
// 4. Retrieve the user from the MySQL database.
// 5. Confirm that the account is still active.
// 6. Attach authenticated user information to req.user.
// 7. Allow the request to continue.
//
// SECURITY:
// - Reject missing or invalid tokens.
// - Reject expired tokens.
// - Reject deleted or inactive accounts.
// - Use current database roles rather than trusting
//   potentially outdated role information in the JWT.
// --------------------------------------------------

"use strict";

const jwt = require("jsonwebtoken");
const pool = require("../db");

// --------------------------------------------------
// AUTHENTICATE TOKEN
// --------------------------------------------------

async function authenticateToken(req, res, next) {
    try {
        // Retrieve the Authorization header.
        //
        // Expected format:
        // Authorization: Bearer <JWT_TOKEN>

        const authHeader = req.headers.authorization;

        // Reject requests without a valid Bearer header.
        if (
            typeof authHeader !== "string" ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Authentication token required",
            });
        }

        // Extract the token from the header.
        const token = authHeader.slice(7).trim();

        // Reject an empty token.
        if (!token) {
            return res.status(401).json({
                message: "Authentication token required",
            });
        }

        // Confirm that the JWT signing secret exists.
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Verify the JWT signature and expiration.
        //
        // The algorithms option prevents accepting
        // unexpected signing algorithms.

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
            });
        } catch (error) {
            // Invalid or expired tokens receive HTTP 401.
            return res.status(401).json({
                message: "Invalid or expired authentication token",
            });
        }

        // Ensure the JWT contains a valid user ID.
        if (
            !decoded ||
            !Number.isSafeInteger(decoded.userId) ||
            decoded.userId <= 0
        ) {
            return res.status(401).json({
                message: "Invalid authentication token",
            });
        }

        // --------------------------------------------------
        // VERIFY CURRENT USER ACCOUNT
        // --------------------------------------------------
        // A valid JWT alone is not sufficient.
        //
        // The account may have been disabled or deleted
        // after the token was issued.
        //
        // Therefore, we check the database on each request.
        // --------------------------------------------------

        const [users] = await pool.execute(
            `SELECT
                user_id,
                username,
                role,
                customer_id,
                is_active
             FROM users
             WHERE user_id = ?
             LIMIT 1`,
            [decoded.userId]
        );

        // Reject tokens belonging to deleted accounts.
        if (users.length === 0) {
            return res.status(401).json({
                message: "User account not found",
            });
        }

        const user = users[0];

        // Reject inactive accounts.
        if (!user.is_active) {
            return res.status(403).json({
                message: "User account is inactive",
            });
        }

        // --------------------------------------------------
        // ATTACH AUTHENTICATED USER
        // --------------------------------------------------
        // Subsequent middleware and routes can access:
        //
        // req.user.userId
        // req.user.username
        // req.user.role
        // req.user.customerId
        // --------------------------------------------------

        req.user = {
            userId: user.user_id,
            username: user.username,
            role: user.role,
            customerId: user.customer_id,
        };

        // Continue to the protected route.
        return next();

    } catch (error) {
        // Log diagnostic information on the server.
        // Never expose database errors to API clients.

        console.error(
            "Authentication middleware error:",
            error.code || error.message
        );

        return res.status(500).json({
            message: "An internal server error occurred",
        });
    }
}

// --------------------------------------------------
// EXPORT MIDDLEWARE
// --------------------------------------------------

module.exports = {
    authenticateToken,
};