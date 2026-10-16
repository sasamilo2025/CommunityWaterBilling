// --------------------------------------------------
// COMMUNITY WATER BILLING SYSTEM
// CREATE TEST ADMINISTRATOR
// --------------------------------------------------
// PURPOSE:
// Creates a temporary administrator account for
// testing our authentication system.
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

const USERNAME = "bridge_admin_test";
const ROLE = "ADMIN";

// --------------------------------------------------
// PASSWORD INPUT
// --------------------------------------------------
// This function reads the password without echoing
// the characters to the terminal.
// --------------------------------------------------

function promptForPassword() {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });

        let password = "";

        // Override terminal output while the password
        // is being entered.
        rl._writeToOutput = function (text) {
            if (text.includes("Enter temporary admin password:")) {
                rl.output.write(text);
            }
        };

        rl.question("Enter temporary admin password: ", (answer) => {
            password = answer;
            rl.close();
            process.stdout.write("\n");
            resolve(password);
        });

        rl.on("SIGINT", () => {
            rl.close();
            reject(new Error("Password entry cancelled"));
        });
    });
}

// --------------------------------------------------
// CREATE TEST ADMINISTRATOR
// --------------------------------------------------

async function createTestAdmin() {
    try {
        // Check whether the test username already exists.
        const [existingUsers] = await pool.execute(
            "SELECT user_id FROM users WHERE username = ? LIMIT 1",
            [USERNAME]
        );

        if (existingUsers.length > 0) {
            console.log("Test administrator already exists.");
            return;
        }

        // Ask for a temporary password.
        const password = await promptForPassword();

        // Require a reasonably strong test password.
        if (password.length < 12) {
            console.log("Password must contain at least 12 characters.");
            return;
        }

        // Convert plaintext password into an Argon2id hash.
        const passwordHash = await hashPassword(password);

        // Insert administrator account into MySQL.
        // ADMIN accounts must have customer_id = NULL.
        const [result] = await pool.execute(
            `INSERT INTO users
                (username, password_hash, role, customer_id, is_active)
             VALUES (?, ?, ?, NULL, 1)`,
            [USERNAME, passwordHash, ROLE]
        );

        console.log("Test administrator created successfully!");
        console.log("User ID:", result.insertId);
        console.log("Username:", USERNAME);
        console.log("Role:", ROLE);

    } catch (error) {
        console.error("Administrator creation failed:", error.code || error.message);
        process.exitCode = 1;
    } finally {
        // Close database connections when finished.
        await pool.end();
    }
}

// --------------------------------------------------
// RUN SCRIPT
// --------------------------------------------------

createTestAdmin();