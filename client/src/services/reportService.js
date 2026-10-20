// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// MANAGEMENT REPORT SERVICE
// ==================================================
//
// Connects React to our protected Express reporting API.
//
// ADMIN and MANAGER only.
// ==================================================

const API_URL =
    "http://localhost:3000/api/reports/monthly-customers";

export async function getMonthlyCustomerReport(token) {

    const response = await fetch(API_URL, {

        method: "GET",

        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Unable to retrieve management reports"
        );
    }

    return data;
}