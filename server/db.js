// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// Database Connection - db.js
// ==================================================

// --------------------------------------------------
// STEP 1: LOAD ENVIRONMENT VARIABLES
// --------------------------------------------------
// dotenv reads our private .env file.
//
// This allows us to access database settings
// without writing passwords directly into our code.

// --------------------------------------------------
// LOAD ENVIRONMENT VARIABLES
// --------------------------------------------------
// __dirname identifies the directory containing db.js.
//
// This ensures that Node.js loads server/.env
// regardless of the terminal's working directory.
//
// Example:
// node server/index.js
// OR
// cd server && node index.js
//
// Both commands will use the same configuration.

const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

// --------------------------------------------------
// STEP 2: IMPORT MYSQL2
// --------------------------------------------------
// mysql2 provides the connection between
// our Node.js backend and MySQL.
//
// The promise version allows us to use
// async/await when executing SQL queries.

const mysql = require("mysql2/promise");

// --------------------------------------------------
// STEP 3: CREATE DATABASE CONNECTION POOL
// --------------------------------------------------
// A connection pool manages reusable database
// connections instead of opening a new connection
// for every HTTP request.

const pool = mysql.createPool({

    // MySQL server location
    host: process.env.DB_HOST,

    // Dedicated application database account
    user: process.env.DB_USER,

    // Password stored securely in .env
    password: process.env.DB_PASSWORD,

    // Our Community Water Billing database
    database: process.env.DB_NAME,

    // Wait if all connections are currently busy
    waitForConnections: true,

    // Maximum simultaneous connections
    connectionLimit: 10,

    // Maximum number of queued requests
    queueLimit: 0
});

// --------------------------------------------------
// STEP 4: EXPORT THE CONNECTION POOL
// --------------------------------------------------
// Other backend files can import this pool
// to execute SQL queries.
//
// Example:
// const pool = require("./db");

module.exports = pool;