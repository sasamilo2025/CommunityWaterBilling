// --------------------------------------------------
// COMMUNITY WATER BILLING SYSTEM
// ADMINISTRATOR LOGIN TEST
// --------------------------------------------------
// PURPOSE:
// Tests our Express authentication endpoint.
//
// TEST PROCESS:
// 1. Ask for the administrator password.
// 2. Send credentials to the Express login API.
// 3. Receive and inspect the HTTP response.
// 4. Confirm whether a JWT token was generated.
// 5. Display the authenticated user's details.
//
// SECURITY:
// - Password characters are hidden during entry.
// - The password is not saved to a file.
// - The JWT token is not displayed.
// --------------------------------------------------

"use strict";

const readline = require("node:readline");

// --------------------------------------------------
// TEST ACCOUNT CONFIGURATION
// --------------------------------------------------

const USERNAME = "bridge_admin_test";

const LOGIN_URL = "http://localhost:3000/api/auth/login";

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

        // Prevent password characters from appearing
        // while the user types.
        rl._writeToOutput = function (text) {
            if (text.includes("Enter admin password:")) {
                rl.output.write(text);
            }
        };

        rl.question("Enter admin password: ", (password) => {
            rl.close();

            // Move the cursor to the next line.
            process.stdout.write("\n");

            resolve(password);
        });

        // Allow the user to cancel password entry.
        rl.on("SIGINT", () => {
            rl.close();
            reject(new Error("Password entry cancelled"));
        });
    });
}

// --------------------------------------------------
// TEST LOGIN
// --------------------------------------------------

async function testLogin() {
    try {

        // Ask for the same password used when
        // creating the administrator account.
        const password = await promptForPassword();

        // Send the login request to our Express API.
        // Node.js provides fetch() globally.
        const response = await fetch(LOGIN_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                username: USERNAME,
                password: password,
            }),
        });

        // Convert the API's JSON response into
        // a JavaScript object.
        const data = await response.json();

        // Display the HTTP status.
        console.log("HTTP Status:", response.status);

        // --------------------------------------------------
        // SUCCESSFUL LOGIN
        // --------------------------------------------------

        if (response.ok) {
            console.log("Login: Successful");

            // Check that the API returned a JWT.
            // Never print the actual token.
            console.log("JWT Token Received:", Boolean(data.token));

            // Display the authenticated user's details.
            console.log("Username:", data.user?.username);
            console.log("Role:", data.user?.role);

        } else {

            // --------------------------------------------------
            // FAILED LOGIN
            // --------------------------------------------------

            console.log("Login: Failed");
            console.log("Message:", data.message);
            process.exitCode = 1;
        }

    } catch (error) {

        // Report connection or execution errors.
        console.error("Login test error:", error.message);
        process.exitCode = 1;
    }
}

// --------------------------------------------------
// RUN LOGIN TEST
// --------------------------------------------------

testLogin();