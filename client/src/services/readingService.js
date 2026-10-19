// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER READINGS API SERVICE
// ==================================================
//
// PURPOSE:
// Communicate with the Express meter readings API.
//
// SECURITY:
// JWT authentication is required.
//
// ACCESS:
// ADMIN   - Retrieve readings.
// MANAGER - Retrieve readings.
// CUSTOMER - Future customer-specific endpoint.
//
// ==================================================

"use strict";

// ==================================================
// API BASE URL
// ==================================================

const API_URL = "http://localhost:3000/api/readings";


// ==================================================
// GET ALL METER READINGS
// ==================================================
//
// ENDPOINT:
// GET /api/readings
//
// PURPOSE:
// Retrieve existing meter readings from MySQL.
//
// RETURNS:
// {
//     message: "...",
//     count: number,
//     readings: [...]
//
// }
// ==================================================

export async function getReadings(token) {

    // Send authenticated request to Express.
    const response = await fetch(API_URL, {

        method: "GET",

        headers: {

            // Send the JWT provided after login.
            Authorization: `Bearer ${token}`

        }

    });

    // Convert the API response to JavaScript data.
    const data = await response.json();

    // Report errors such as HTTP 401, 403 or 500.
    if (!response.ok) {

        throw new Error(
            data.message || "Unable to retrieve meter readings."
        );

    }

    // Return the complete response.
    return data;
}

// ==================================================
// REGISTER INITIAL METER READING
// ==================================================
//
// ADMIN only.
//
// Saves the opening reading when a meter is installed.
// INITIAL readings do not generate invoices.
// ==================================================

export async function registerInitialReading(token, reading) {

    const response = await fetch(`${API_URL}/initial`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(reading)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Unable to register initial reading."
        );
    }

    return data;
}


// ==================================================
// REGISTER MONTHLY METER READING
// ==================================================
//
// ADMIN only.
//
// Saves an actual meter reading against an
// explicitly confirmed billing month.
//
// The backend independently validates:
// - Reading dates.
// - Reading values.
// - Billing-month sequence.
// - ADMIN confirmation.
// ==================================================

export async function registerMonthlyReading(token, reading) {

    const response = await fetch(`${API_URL}/monthly`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(reading)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Unable to register monthly reading."
        );
    }

    return data;
}