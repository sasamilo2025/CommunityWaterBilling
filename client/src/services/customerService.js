// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CUSTOMER API SERVICE
// ==================================================
//
// PURPOSE:
// Communicate with the protected Express customer API.
//
// SECURITY:
// Send the authenticated user's JWT with each request.
//
// ==================================================

const API_URL = "http://localhost:3000/api/customers";

// ==================================================
// CREATE CUSTOMER
// ==================================================
// POST /api/customers
//
// ADMIN ONLY
// ==================================================

export async function createCustomer(customerData, token) {

    // Send customer information to Express.
    const response = await fetch(API_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",

            // JWT authentication.
            Authorization: `Bearer ${token}`
        },

        // Convert the customer object into JSON.
        body: JSON.stringify(customerData)
    });

    // Read the JSON response from Express.
    const data = await response.json();

    // Handle unsuccessful requests.
    if (!response.ok) {
        throw new Error(
            data.message || "Failed to create customer"
        );
    }

    // Return the successful response.
    return data;
}

// ==================================================
// READ CUSTOMERS
// ==================================================
// GET /api/customers
//
// PURPOSE:
// Retrieve the customer list from our Express API.
//
// SECURITY:
// ADMIN and MANAGER roles are authorized by Express.
// A valid JWT must accompany the request.
//
// ==================================================

export async function getCustomers(token) {

    // Send an authenticated GET request to Express.
    const response = await fetch(API_URL, {
        method: "GET",

        headers: {
            // Include the JWT issued during login.
            Authorization: `Bearer ${token}`
        }
    });

    // Convert the API response into JavaScript data.
    const data = await response.json();

    // Handle errors such as 401, 403 or 500.
    if (!response.ok) {
        throw new Error(
            data.message || "Failed to retrieve customers"
        );
    }

    // Return the API response containing customer records.
    return data;
}

// ==================================================
// UPDATE CUSTOMER
// ==================================================
//
// ENDPOINT:
// PUT /api/customers/:id
//
// PURPOSE:
// Update an existing customer in MySQL.
//
// SECURITY:
// ADMIN ONLY.
// The JWT is included in the request.
//
// ==================================================

export async function updateCustomer(customerId, customerData, token) {

    // Send an authenticated PUT request to Express.
    const response = await fetch(
        `${API_URL}/${customerId}`,
        {
            method: "PUT",

            headers: {
                // Tell Express we are sending JSON.
                "Content-Type": "application/json",

                // Authenticate the ADMIN user.
                Authorization: `Bearer ${token}`
            },

            // Convert customer information to JSON.
            body: JSON.stringify(customerData)
        }
    );

    // Read the response from Express.
    const data = await response.json();

    // Handle errors returned by Express.
    if (!response.ok) {
        throw new Error(
            data.message || "Failed to update customer"
        );
    }

    // Return the successful UPDATE response.
    return data;
}

// ==================================================
// UPDATE CUSTOMER STATUS
// ==================================================
//
// ENDPOINT:
// PATCH /api/customers/:id/status
//
// PURPOSE:
// Activate or deactivate an existing customer
// without deleting their database records.
//
// SECURITY:
// ADMIN ONLY.
// Express verifies the JWT and ADMIN role.
//
// VALID STATUS VALUES:
// ACTIVE or INACTIVE.
//
// ==================================================

export async function updateCustomerStatus(customerId, status, token) {

    // Send an authenticated PATCH request to Express.
    const response = await fetch(
        `${API_URL}/${customerId}/status`,
        {
            method: "PATCH",

            headers: {
                // Tell Express we are sending JSON.
                "Content-Type": "application/json",

                // Authenticate the ADMIN user.
                Authorization: `Bearer ${token}`
            },

            // Send the requested customer status.
            body: JSON.stringify({
                status: status
            })
        }
    );

    // Convert the Express response into JavaScript data.
    const data = await response.json();

    // Handle errors such as 400, 401, 403, 404 or 500.
    if (!response.ok) {
        throw new Error(
            data.message || "Failed to update customer status"
        );
    }

    // Return the successful PATCH response.
    return data;
}