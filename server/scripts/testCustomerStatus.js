// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// MISSION 25 — CUSTOMER STATUS API TEST
// ==================================================
//
// PURPOSE:
// Authenticate an ADMIN and change a customer's
// status using our protected PATCH endpoint.
//
// SECURITY:
// - Password entered interactively.
// - Password is not stored in source code.
// - JWT is kept in memory.
// - JWT is never displayed.
//
// TEST CUSTOMER:
// TST01 — John Test (customer_id = 1)
//
// ==================================================

"use strict";

const readline = require("node:readline");

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const USERNAME = "bridge_admin_test";

const LOGIN_URL = "http://localhost:3000/api/auth/login";

const CUSTOMER_ID = 1;

const STATUS_URL =
    `http://localhost:3000/api/customers/${CUSTOMER_ID}/status`;

// --------------------------------------------------
// HIDDEN PASSWORD INPUT
// --------------------------------------------------

function promptForPassword() {
    return new Promise((resolve, reject) => {

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });

        // Hide password characters during entry.
        rl._writeToOutput = function (text) {
            if (text.includes("Enter admin password:")) {
                rl.output.write(text);
            }
        };

        rl.question("Enter admin password: ", (password) => {
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
// MAIN TEST
// --------------------------------------------------

async function testCustomerStatus() {
    try {

        // STEP 1 — Authenticate ADMIN.
        const password = await promptForPassword();

        const loginResponse = await fetch(LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: USERNAME,
                password,
            }),
        });

        const loginData = await loginResponse.json();

        if (
            !loginResponse.ok ||
            !loginData.token ||
            loginData.user?.role !== "ADMIN"
        ) {
            console.log("ADMIN login failed.");
            console.log("HTTP Status:", loginResponse.status);
            process.exitCode = 1;
            return;
        }

        console.log("ADMIN authentication: SUCCESS");

        // STEP 2 — Request confirmation before changing data.
        //
        // This test intentionally deactivates
        // only our fictional test customer.

        const confirmation = await new Promise((resolve) => {

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            rl.question(
                "Reactivate test customer TST01? (yes/no): ",
                (answer) => {
                    rl.close();
                    resolve(answer.trim().toLowerCase());
                }
            );
        });

        if (confirmation !== "yes") {
            console.log("Test cancelled. No customer changes requested.");
            return;
        }

        // STEP 3 — Send authenticated PATCH request.
        const response = await fetch(STATUS_URL, {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginData.token}`,
            },

            body: JSON.stringify({
                status: "ACTIVE",
            }),
        });

        const data = await response.json();

        // STEP 4 — Display safe test results.
        console.log("PATCH HTTP Status:", response.status);
        console.log("API Message:", data.message);
        console.log("Customer ID:", data.customer_id);
        console.log("New Status:", data.status);

        if (!response.ok) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error("Customer status test error:", error.message);
        process.exitCode = 1;
    }
}

// --------------------------------------------------
// RUN TEST
// --------------------------------------------------

testCustomerStatus();