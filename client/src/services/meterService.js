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