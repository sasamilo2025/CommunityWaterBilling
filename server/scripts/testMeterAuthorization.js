// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER AUTHORIZATION SECURITY TEST
// ==================================================
//
// PURPOSE:
// Verify that MANAGER cannot register water meters.
//
// EXPECTED RESULT:
// POST /api/meters -> HTTP 403 Forbidden
//
// SECURITY:
// Password is entered without displaying characters.
// JWT remains in memory and is never printed.
//
// IMPORTANT:
// This test must not create a meter record.
// ==================================================

"use strict";

const readline = require("node:readline");

// Existing MANAGER test account.
const USERNAME = "bridge_manager_test";

// Express API endpoints.
const LOGIN_URL = "http://localhost:3000/api/auth/login";
const METERS_URL = "http://localhost:3000/api/meters";

// --------------------------------------------------
// REQUEST PASSWORD WITHOUT DISPLAYING IT
// --------------------------------------------------

function promptForPassword() {
    return new Promise((resolve, reject) => {

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        // Hide the password while typing.
        rl._writeToOutput = function (text) {
            if (text.includes("Enter MANAGER password:")) {
                rl.output.write(text);
            }
        };

        rl.question(
            "Enter MANAGER password: ",
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
// RUN AUTHORIZATION TEST
// --------------------------------------------------

async function testMeterAuthorization() {

    try {

        // STEP 1: Authenticate as MANAGER.
        const password = await promptForPassword();

        const loginResponse = await fetch(LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: USERNAME,
                password
            })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            console.log(
                "Login failed:",
                loginResponse.status,
                loginData.message
            );
            process.exitCode = 1;
            return;
        }

        // Confirm the account has the expected role.
        if (loginData.user?.role !== "MANAGER") {
            console.log("TEST STOPPED: Account is not MANAGER");
            process.exitCode = 1;
            return;
        }

        console.log("MANAGER login: SUCCESS");

        // STEP 2: Attempt to register a meter.
        // This request must be rejected before insertion.
        const response = await fetch(METERS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loginData.token}`
            },
            body: JSON.stringify({
                meter_serial: "9999-9999",
                customer_id: 1,
                location: "Authorization Test",
                status: "ACTIVE",
                installed_at: "2026-10-17"
            })
        });

        const result = await response.json();

        // STEP 3: Check the HTTP response.
        console.log("Meter POST HTTP Status:", response.status);
        console.log("Server Message:", result.message);

        if (response.status === 403) {
            console.log("PASS: MANAGER registration denied");
        } else {
            console.log("FAIL: Expected HTTP 403");
            process.exitCode = 1;
        }

    } catch (error) {
        console.error("Test error:", error.message);
        process.exitCode = 1;
    }
}

// Execute the test.
testMeterAuthorization();