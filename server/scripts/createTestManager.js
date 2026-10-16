// --------------------------------------------------
// COMMUNITY WATER BILLING SYSTEM
// CREATE TEST MANAGER
// --------------------------------------------------
// PURPOSE:
// Creates a temporary MANAGER account for testing
// authentication and role-based authorization.
//
// SECURITY:
// 1. Prompts for a password without displaying it.
// 2. Hashes the password using Argon2id.
// 3. Stores only the password hash in MySQL.
// 4. Uses a parameterized SQL query.
// 5. Prevents duplicate usernames.
//
// DEVELOPMENT USE ONLY.
// --------------------------------------------------

"use strict";

const readline = require("node:readline");
const pool = require("../db");
const { hashPassword } = require("../utils/passwordUtils");

// --------------------------------------------------
// ACCOUNT CONFIGURATION
// --------------------------------------------------
// MANAGER accounts are not linked to individual
// customer records.
// --------------------------------------------------

const USERNAME = "bridge_manager_test";
const ROLE = "MANAGER";

// --------------------------------------------------
// PASSWORD INPUT
// --------------------------------------------------
// Reads the password without displaying its
// characters in the terminal.
// --------------------------------------------------

function promptForPassword() {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });

        // Hide the password while it is being typed.
        rl._writeToOutput = function (text) {
            if (text.includes("Enter temporary manager password:")) {
                rl.output.write(text);
            }
        };

        rl.question(
            "Enter temporary manager password: ",
            (password) => {
                rl.close();
                process.stdout.write("\n");
                resolve(password);
            }
        );

        // Allow the user to cancel password entry.
        rl.on("SIGINT", () => {
            rl.close();
            reject(new Error("Password entry cancelled"));
        });
    });
}

// --------------------------------------------------
// CREATE TEST MANAGER
// --------------------------------------------------

async function createTestManager() {
    try {
        // --------------------------------------------------
        // STEP 1: CHECK FOR EXISTING USERNAME
        // --------------------------------------------------
        // Prevent accidental creation of duplicate accounts.
        // --------------------------------------------------

        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE username = ? LIMIT 1",
            [USERNAME]
        );

        if (existingUsers.length > 0) {
            console.log("Test manager already exists.");
            return;
        }

        // --------------------------------------------------
        // STEP 2: REQUEST PASSWORD
        // --------------------------------------------------

        const password = await promptForPassword();

        // Require at least 12 characters.
        if (password.length < 12) {
            console.log(
                "Password must contain at least 12 characters."
            );
            return;
        }

        // --------------------------------------------------
        // STEP 3: HASH PASSWORD
        // --------------------------------------------------
        // Never store plaintext passwords in MySQL.
        // --------------------------------------------------

        const passwordHash = await hashPassword(password);

        // --------------------------------------------------
        // STEP 4: INSERT MANAGER INTO DATABASE
        // --------------------------------------------------
        // customer_id = NULL because MANAGER is a
        // management role, not a customer login.
        //
        // Parameterized placeholders (?) protect against
        // SQL injection.
        // --------------------------------------------------

        const [result] = await pool.execute(
            `INSERT INTO users
                (username, password_hash, role, customer_id, is_active)
             VALUES (?, ?, ?, NULL, 1)`,
            [USERNAME, passwordHash, ROLE]
        );

        // --------------------------------------------------
        // STEP 5: CONFIRM SUCCESS
        // --------------------------------------------------

        console.log("Test manager created successfully!");
        console.log("User ID:", result.insertId);
        console.log("Username:", USERNAME);
        console.log("Role:", ROLE);

    } catch (error) {
        console.error(
            "Manager creation failed:",
            error.code || error.message
        );

        process.exitCode = 1;

    } finally {
        // Close the database connection pool.
        await pool.end();
    }
}

// --------------------------------------------------
// RUN SCRIPT
// --------------------------------------------------

createTestManager();