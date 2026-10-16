// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CREATE TEST CUSTOMER
// ==================================================
//
// PURPOSE:
// Creates a temporary CUSTOMER login account linked
// to an existing customer record.
//
// SECURITY:
// - Password is hashed using Argon2id.
// - SQL statements use parameterized queries.
// - Duplicate usernames are prevented.
// - Duplicate customer associations are prevented.
//
// DEVELOPMENT USE ONLY.
// ==================================================

"use strict";

const readline = require("node:readline");
const pool = require("../db");
const { hashPassword } = require("../utils/passwordUtils");

// --------------------------------------------------
// ACCOUNT CONFIGURATION
// --------------------------------------------------

const USERNAME = "bridge_customer_test";
const ROLE = "CUSTOMER";

// Existing customer record:
// customer_no = TST01
const CUSTOMER_ID = 1;

// --------------------------------------------------
// PASSWORD INPUT
// --------------------------------------------------
// Request a temporary password without intentionally
// displaying its characters in the terminal.
// --------------------------------------------------

function promptForPassword() {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });

        rl._writeToOutput = function (text) {
            if (text.includes("Enter temporary customer password:")) {
                rl.output.write(text);
            }
        };

        rl.question(
            "Enter temporary customer password: ",
            (password) => {
                rl.close();
                process.stdout.write("\n");
                resolve(password);
            }
        );

        rl.on("SIGINT", () => {
            rl.close();
            reject(new Error("Password entry cancelled"));
        });
    });
}

// --------------------------------------------------
// CREATE CUSTOMER LOGIN
// --------------------------------------------------

async function createTestCustomer() {
    try {
        // STEP 1:
        // Check whether the username already exists.

        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE username = ? LIMIT 1",
            [USERNAME]
        );

        if (existingUsers.length > 0) {
            console.log("Test customer login already exists.");
            return;
        }

        // STEP 2:
        // Verify the customer record exists.

        const [customers] = await pool.execute(
            "SELECT customer_id FROM customers WHERE customer_id = ? LIMIT 1",
            [CUSTOMER_ID]
        );

        if (customers.length === 0) {
            console.log("Customer record does not exist.");
            return;
        }

        // STEP 3:
        // Check whether this customer already has a login.

        const [linkedUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE customer_id = ? LIMIT 1",
            [CUSTOMER_ID]
        );

        if (linkedUsers.length > 0) {
            console.log("Customer already has a login account.");
            return;
        }

        // STEP 4:
        // Request a temporary password.

        const password = await promptForPassword();

        if (password.length < 12) {
            console.log("Password must contain at least 12 characters.");
            return;
        }

        // STEP 5:
        // Hash the password using Argon2id.

        const passwordHash = await hashPassword(password);

        // STEP 6:
        // Insert the CUSTOMER account into MySQL.

        const [result] = await pool.execute(
            `INSERT INTO users
                (username, password_hash, role, customer_id, is_active)
             VALUES (?, ?, ?, ?, 1)`,
            [USERNAME, passwordHash, ROLE, CUSTOMER_ID]
        );

        // STEP 7:
        // Display account creation confirmation.

        console.log("Test customer created successfully!");
        console.log("User ID:", result.insertId);
        console.log("Username:", USERNAME);
        console.log("Role:", ROLE);
        console.log("Customer ID:", CUSTOMER_ID);

    } catch (error) {
        console.error(
            "Customer creation failed:",
            error.code || error.message
        );

        process.exitCode = 1;

    } finally {
        // Close database connections.
        await pool.end();
    }
}

// --------------------------------------------------
// RUN SCRIPT
// --------------------------------------------------

createTestCustomer();