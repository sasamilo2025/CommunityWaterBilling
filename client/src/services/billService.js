// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CUSTOMER INVOICE API SERVICE
// ==================================================
//
// PURPOSE:
// Connect React to the Express Bills API.
//
// SECURITY:
// JWT authentication is required.
//
// ==================================================

const API_URL = "http://localhost:3000/api/bills";


// ==================================================
// GET ALL INVOICES
// ==================================================
//
// ADMIN and MANAGER may retrieve invoices.
// ==================================================

export async function getBills(token) {

    const response = await fetch(API_URL, {

        method: "GET",

        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.message || "Unable to retrieve invoices."
        );
    }

    return data;
}


// ==================================================
// CREATE CUSTOMER INVOICE
// ==================================================
//
// ADMIN only.
//
// The backend obtains meter readings and calculates
// invoice information using MySQL.
// ==================================================

export async function createBill(token, billData) {

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(billData)
    });

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.message || "Unable to generate invoice."
        );
    }

    return data;
}