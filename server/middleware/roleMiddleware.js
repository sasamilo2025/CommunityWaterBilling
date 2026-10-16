// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// Version 1.0
// ==================================================

// PURPOSE:
// Restrict access to API routes based on the
// authenticated user's role.
//
// Supported roles:
// ADMIN
// MANAGER
// CUSTOMER
//
// IMPORTANT:
// This middleware must run AFTER authenticateToken,
// because authenticateToken creates req.user.
// ==================================================

"use strict";

// --------------------------------------------------
// AUTHORIZE ROLES
// --------------------------------------------------
// Accepts one or more permitted roles.
//
// Example:
// authorizeRoles("ADMIN")
//
// Example:
// authorizeRoles("ADMIN", "MANAGER")
// --------------------------------------------------

function authorizeRoles(...allowedRoles) {

    // Return Express middleware.
    return (req, res, next) => {

        // ------------------------------------------
        // VERIFY AUTHENTICATED USER
        // ------------------------------------------

        // The JWT middleware should already have
        // attached authenticated user information.

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        // ------------------------------------------
        // CHECK USER ROLE
        // ------------------------------------------

        // Determine whether the authenticated user's
        // role is included in the permitted roles.

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied: insufficient permissions",
            });
        }

        // ------------------------------------------
        // AUTHORIZATION SUCCESSFUL
        // ------------------------------------------

        // Allow Express to continue to the route.

        return next();
    };
}

// --------------------------------------------------
// EXPORT MIDDLEWARE
// --------------------------------------------------

module.exports = {
    authorizeRoles,
};