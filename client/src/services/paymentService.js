// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// PAYMENT MANAGEMENT API SERVICE
// ==================================================
//
// PURPOSE:
// Connect React to the Express Payments API.
//
// SECURITY:
// Every request includes the JWT authentication
// token provided by App.jsx.
//
// ROLE PERMISSIONS:
// ADMIN   - Retrieve and register payments.
// MANAGER - Retrieve payments only.
//
// ==================================================

const API_URL = "http://localhost:3000/api/payments";


// ==================================================
// GET ALL PAYMENTS
// ==================================================
//
// ENDPOINT:
// GET /api/payments
//
// Retrieves payment history from MySQL.
// ==================================================

export async function getPayments(token) {

    // Send authenticated request to Express.
    const response = await fetch(API_URL, {

        method: "GET",

        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Read the JSON response from the backend.
    const data = await response.json();

    // Handle errors such as 401, 403 and 500.
    if (!response.ok) {

        throw new Error(
            data.message || "Unable to retrieve payments."
        );
    }

    // Return payment history to React.
    return data;
}


// ==================================================
// REGISTER CUSTOMER PAYMENT
// ==================================================
//
// ENDPOINT:
// POST /api/payments
//
// ADMIN only.
//
// The backend:
// - Verifies the invoice.
// - Checks the outstanding balance.
// - Prevents overpayments.
// - Registers the payment.
// - Updates the invoice status.
//
// ==================================================

export async function createPayment(token, paymentData) {

    // Send payment details to Express.
    const response = await fetch(API_URL, {

        method: "POST",

        headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`
        },

        body: JSON.stringify(paymentData)
    });

    // Convert Express response into JavaScript data.
    const data = await response.json();

    // Display meaningful backend errors.
    if (!response.ok) {

        throw new Error(
            data.message || "Unable to register payment."
        );
    }

    // Return the newly registered payment.
    return data;
}