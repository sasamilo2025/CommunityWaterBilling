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
// IMPORT MYSQL DATABASE CONNECTION
// --------------------------------------------------
// db.js exports our MySQL connection pool.
// We use this pool to execute SQL queries.

const pool = require("./db");

// --------------------------------------------------
// STEP 2: CREATE THE EXPRESS APPLICATION
// --------------------------------------------------

const app = express();

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