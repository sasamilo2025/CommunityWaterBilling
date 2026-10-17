// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER MANAGEMENT API SERVICE
// ==================================================
//
// PURPOSE:
// Communicate with the Express Meter API.
//
// SECURITY:
// Send the JWT authentication token with requests.
//
// ROLE PERMISSIONS:
// ADMIN   - View and maintain meters.
// MANAGER - View meters.
// CUSTOMER - Own meters only (separate endpoint).
//
// ==================================================

"use strict";

// Backend Meter API address.
const METER_API_URL = "http://localhost:3000/api/meters";


// ==================================================
// GET ALL METERS
// ==================================================
//
// ENDPOINT:
// GET /api/meters
//
// PERMISSIONS:
// ADMIN and MANAGER only.
//
// ==================================================

export async function getMeters(token) {

    // Send an authenticated request to Express.
    const response = await fetch(METER_API_URL, {
        method: "GET",

        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Convert the API response into JavaScript data.
    const data = await response.json();

    // Handle authentication, authorization or server errors.
    if (!response.ok) {
        throw new Error(
            data.message || "Failed to retrieve meters."
        );
    }

    // Return the meter records to our React component.
    return data;
}
// ==================================================
// CREATE NEW METER
// ==================================================
//
// ENDPOINT:
// POST /api/meters
//
// PURPOSE:
// Register a new water meter against an existing
// customer in our MySQL database.
//
// SECURITY:
// ADMIN ONLY.
// Express verifies the JWT and ADMIN role.
//
// EXPECTED RESPONSES:
// 201 - Meter registered successfully.
// 400 - Invalid meter information.
// 401 - Authentication required.
// 403 - Insufficient permissions.
// 404 - Customer does not exist.
// 409 - Meter number already exists.
//
// ==================================================

export async function createMeter(meterData, token) {

    // Send the new meter information to Express.
    const response = await fetch(METER_API_URL, {

        // POST creates a new database record.
        method: "POST",

        headers: {

            // Tell Express that we are sending JSON.
            "Content-Type": "application/json",

            // Authenticate the ADMIN user.
            Authorization: `Bearer ${token}`
        },

        // Convert the meter information into JSON.
        body: JSON.stringify(meterData)
    });

    // Convert the Express response into JavaScript data.
    const data = await response.json();

    // Handle unsuccessful requests.
    if (!response.ok) {

        // Display the message returned by Express.
        throw new Error(
            data.message || "Failed to register meter."
        );
    }

    // Return the successful registration response.
    return data;
}