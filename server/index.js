// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// Backend API Server - Version 1.0
// ==================================================

// --------------------------------------------------
// STEP 1: IMPORT EXPRESS
// --------------------------------------------------
// Express allows us to create HTTP endpoints
// that our React frontend will communicate with.

const express = require("express");

// --------------------------------------------------
// IMPORT CORS MIDDLEWARE
// --------------------------------------------------
// CORS (Cross-Origin Resource Sharing) allows
// our React frontend to communicate with our
// Express backend from a different origin.
//
// React:   http://localhost:5173
// Express: http://localhost:3000
// --------------------------------------------------

const cors = require("cors");

// --------------------------------------------------
// IMPORT MYSQL DATABASE CONNECTION
// --------------------------------------------------
// db.js exports our MySQL connection pool.
// We use this pool to execute SQL queries.

const pool = require("./db");

// --------------------------------------------------
// IMPORT AUTHENTICATION ROUTES
// --------------------------------------------------
// authRoutes.js contains our authentication endpoints.
//
// We will register these routes under /api/auth.

const authRoutes = require("./routes/authRoutes");

// --------------------------------------------------
// IMPORT CUSTOMER MANAGEMENT ROUTES
// --------------------------------------------------
// customersRoutes.js contains our protected
// Customer CRUD API endpoints.
//
// These routes will be registered under
// /api/customers.
// --------------------------------------------------

const customersRoutes = require("./routes/customersRoutes");

// --------------------------------------------------
// IMPORT METER MANAGEMENT ROUTES
// --------------------------------------------------
// metersRoutes.js contains protected endpoints
// for retrieving and managing water meters.
//
// These routes will be registered under /api/meters.
// --------------------------------------------------

const metersRoutes = require("./routes/metersRoutes");

// --------------------------------------------------
// IMPORT METER READINGS ROUTES
// --------------------------------------------------
// Provides protected API endpoints for retrieving
// and managing monthly water meter readings.
// --------------------------------------------------

const readingsRoutes = require("./routes/readingsRoutes");

// --------------------------------------------------
// STEP 2: CREATE THE EXPRESS APPLICATION
// --------------------------------------------------

const app = express();

// --------------------------------------------------
// ENABLE CORS FOR REACT FRONTEND
// --------------------------------------------------
// Allow browser requests originating from our
// React development server.
//
// This middleware must run before our API routes
// so that CORS headers are included in responses.
// --------------------------------------------------

app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

// --------------------------------------------------
// STEP 3: CONFIGURE THE SERVER PORT
// --------------------------------------------------
// Port 3000 will be used for our backend API.

const PORT = 3000;

// --------------------------------------------------
// STEP 4: ENABLE JSON REQUEST PROCESSING
// --------------------------------------------------
// Allows Express to read JSON data sent by clients.
//
// This will be important when we implement:
// - Customer registration
// - Meter readings
// - Invoice generation
// - Cash payment recording

app.use(express.json());

// --------------------------------------------------
// REGISTER AUTHENTICATION ROUTES
// --------------------------------------------------
// All routes defined in authRoutes.js will begin
// with /api/auth.
//
// Example:
// router.get("/test") becomes GET /api/auth/test.

app.use("/api/auth", authRoutes);

// --------------------------------------------------
// REGISTER CUSTOMER MANAGEMENT ROUTES
// --------------------------------------------------
// All endpoints defined in customersRoutes.js
// will begin with /api/customers.
//
// Example:
// router.get("/") becomes GET /api/customers.
//
// SECURITY:
// Individual customer routes use JWT authentication
// and role-based authorization middleware.
// --------------------------------------------------

app.use("/api/customers", customersRoutes);

// --------------------------------------------------
// REGISTER METER MANAGEMENT ROUTES
// --------------------------------------------------
// All endpoints defined in metersRoutes.js
// will begin with /api/meters.
//
// SECURITY:
// Meter routes enforce JWT authentication
// and role-based authorization.
// --------------------------------------------------

app.use("/api/meters", metersRoutes);

// --------------------------------------------------
// REGISTER METER READINGS ROUTES
// --------------------------------------------------
// Connect the readings router to /api/readings.
//
// Authentication and authorization are enforced
// inside readingsRoutes.js.
// --------------------------------------------------

app.use("/api/readings", readingsRoutes);

// --------------------------------------------------
// STEP 5: CREATE OUR FIRST API ENDPOINT
// --------------------------------------------------
// GET /api/health
//
// This endpoint checks whether our Express
// application is running successfully.
//
// It does not check MySQL yet.
// We will add a database health check later.

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Community Water Billing API is running"
    });
});

// --------------------------------------------------
// STEP 6: DATABASE HEALTH CHECK
// --------------------------------------------------
// GET /api/health/db
//
// This endpoint verifies that Express can
// communicate successfully with MySQL.
//
// SELECT 1 is a lightweight SQL query that
// does not modify any database records.

app.get("/api/health/db", async (req, res) => {
    try {
        // Execute a simple SQL query.
        const [rows] = await pool.query(
            "SELECT 1 AS connection_test"
        );

        // Return a successful response.
        res.status(200).json({
            status: "OK",
            message: "MySQL database connection successful",
            database: "community_water_billing",
            result: rows[0].connection_test
        });

    } catch (error) {
        // Log the error on the backend.
        console.error("Database health check failed:", error.message);

        // Return a safe error response to the client.
        res.status(503).json({
            status: "ERROR",
            message: "Database connection unavailable"
        });
    }
});

// --------------------------------------------------
// STEP 6: START THE EXPRESS SERVER
// --------------------------------------------------
// Express listens for incoming HTTP requests
// on port 3000.

app.listen(PORT, () => {
    console.log(
        `Community Water Billing API running on http://localhost:${PORT}`
    );
});