// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// Authentication API Service
// ==================================================

// --------------------------------------------------
// BACKEND API ADDRESS
// --------------------------------------------------
// Our Express backend runs on localhost:3000.
//
// This is the endpoint responsible for verifying
// usernames and passwords.
// --------------------------------------------------

const LOGIN_URL = "http://localhost:3000/api/auth/login";

// --------------------------------------------------
// LOGIN FUNCTION
// --------------------------------------------------
// Sends the user's credentials to Express.
//
// The backend will:
// 1. Find the user in MySQL.
// 2. Verify the password using Argon2id.
// 3. Check whether the account is active.
// 4. Generate a JWT if authentication succeeds.
// --------------------------------------------------

export async function loginUser(username, password) {

    // Send an HTTP POST request to Express.
    const response = await fetch(LOGIN_URL, {

        method: "POST",

        // Tell Express we are sending JSON data.
        headers: {
            "Content-Type": "application/json"
        },

        // Convert JavaScript values into JSON.
        body: JSON.stringify({
            username,
            password
        })
    });

    // Read the JSON response from Express.
    const data = await response.json();

    // --------------------------------------------------
    // HANDLE FAILED LOGIN
    // --------------------------------------------------
    // fetch() does not automatically throw an error
    // when Express returns HTTP 400, 401, or 403.
    //
    // We must check response.ok ourselves.
    // --------------------------------------------------

    if (!response.ok) {
        throw new Error(
            data.message || "Login failed. Please try again."
        );
    }

    // --------------------------------------------------
    // RETURN SUCCESSFUL LOGIN DATA
    // --------------------------------------------------
    // Expected data:
    // {
    //     message: "Login successful",
    //     token: "...",
    //     user: {
    //         userId: ...,
    //         username: "...",
    //         role: "CUSTOMER / ADMIN / MANAGER",
    //         customerId: ...
    //     }
    // }
    //
    // The React component will decide how to
    // handle the authenticated user.
    // --------------------------------------------------

    return data;
}

// ==================================================
// GET AUTHENTICATED USER
// ==================================================
// PURPOSE:
// Request information from a protected Express route.
//
// SECURITY:
// The JWT is sent in the Authorization header.
// Express verifies the JWT before returning user data.
//
// Never display or log the JWT.
// ==================================================

export async function getAuthenticatedUser(token) {

    // Send an authenticated request to Express.
    const response = await fetch(
        "http://localhost:3000/api/auth/me",
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    // Convert the API response into JavaScript data.
    const data = await response.json();

    // Handle authentication or server errors.
    if (!response.ok) {
        throw new Error(
            data.message || "Authentication verification failed."
        );
    }

    // Return the authenticated user's information.
    return data;
}