// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// MAIN APPLICATION COMPONENT
// ==================================================
//
// App.jsx coordinates the main application interface.
//
// RESPONSIBILITIES:
// 1. Maintain the currently authenticated user.
// 2. Display Login when nobody is authenticated.
// 3. Display a welcome screen after login.
// 4. Provide a logout function.
//
// FUTURE DEVELOPMENT:
// - Role-based dashboards.
// - Protected routes.
// - Customer and meter CRUD.
// ==================================================

// React hook for managing component state.
import { useState } from "react";

// --------------------------------------------------
// AUTHENTICATION API SERVICE
// --------------------------------------------------
// This function uses our JWT to request information
// from the protected Express /api/auth/me endpoint.
// --------------------------------------------------

import { getAuthenticatedUser } from "./services/authService";

// Our existing login page.
import Login from "./pages/Login";

// ADMIN customer management form.
// Receives the JWT from App.jsx.
import CustomerForm from "./components/CustomerForm";

// Display customer records retrieved from our Express API.
import CustomerList from "./components/CustomerList";

// Display registered water meters for ADMIN.
import MeterList from "./components/MeterList";

// ==================================================
// ADMIN METER REGISTRATION
// ==================================================
// Display the meter registration form.
// Express independently enforces ADMIN permissions.
// ==================================================

import MeterForm from "./components/MeterForm";

// ==================================================
// METER READINGS COMPONENT
// ==================================================
// Display existing meter readings for ADMIN/MANAGER.

import ReadingList from "./components/ReadingList";

// ADMIN meter-reading registration form.
import ReadingForm from "./components/ReadingForm";

// ==================================================
// CUSTOMER BILLING COMPONENTS
// ==================================================
// ADMIN creates invoices.
// ADMIN and MANAGER can view invoices.

import BillForm from "./components/BillForm";
import BillList from "./components/BillList";

// --------------------------------------------------
// ROLE-BASED DASHBOARD NAVIGATION
// --------------------------------------------------
// Displays different navigation menus for:
// ADMIN, MANAGER and CUSTOMER.
//
// Menu selection will be controlled by App.jsx.
// --------------------------------------------------

import DashboardSidebar from "./components/DashboardSidebar";

// Reusable welcome panel for all three dashboard roles.
import DashboardHome from "./components/DashboardHome";

// --------------------------------------------------
// FEATURE PLACEHOLDER
// --------------------------------------------------
// Displays an informative message when the selected
// dashboard module is not yet implemented.
// --------------------------------------------------

import FeaturePlaceholder from "./components/FeaturePlaceholder";

// Application styling.
import "./App.css";

function App() {

    // --------------------------------------------------
    // AUTHENTICATION STATE
    // --------------------------------------------------
    // null means no user is currently logged in.
    //
    // After successful login, this state will contain
    // the authenticated user's information.
    // --------------------------------------------------

    const [user, setUser] = useState(null);

    // --------------------------------------------------
    // JWT AUTHENTICATION TOKEN
    // --------------------------------------------------
    // Store the JWT in React memory.
    //
    // We will use this token when requesting protected
    // information from our Express backend.
    // --------------------------------------------------

    const [token, setToken] = useState(null);

    // --------------------------------------------------
    // DASHBOARD NAVIGATION STATE
    // --------------------------------------------------
    // Tracks the menu currently selected by the user.
    //
    // The dashboard is the default landing page.
    // --------------------------------------------------

    const [activeMenu, setActiveMenu] = useState("dashboard");

    // ==================================================
    // METER LIST REFRESH CONTROL
    // ==================================================
    // Increment this value after a successful meter
    // registration to reload the meter list.
    // ==================================================

    const [meterRefreshKey, setMeterRefreshKey] = useState(0);

    // ==================================================
    // METER READINGS HISTORY REFRESH CONTROL
    // ==================================================
    // Increment this value after successfully saving
    // a meter reading.
    //
    // React will reload ReadingList so the new
    // reading appears immediately in the table.
    // ==================================================

    const [readingsRefreshKey, setReadingsRefreshKey] = useState(0);

    // Reload invoice history after an invoice is saved.
    const [billsRefreshKey, setBillsRefreshKey] = useState(0);

    // --------------------------------------------------
    // HANDLE SUCCESSFUL LOGIN
    // --------------------------------------------------
    // Receive the authenticated user and JWT from
    // Login.jsx.
    //
    // Both values remain in React memory.
    // --------------------------------------------------

    function handleLoginSuccess(loginData) {

    // Store the authenticated session.
    setToken(loginData.token);
    setUser(loginData.user);

    // Always begin at the dashboard after login.
    setActiveMenu("dashboard");
}

    // --------------------------------------------------
    // HANDLE LOGOUT
    // --------------------------------------------------
    // Clear the authenticated user and JWT from memory.
    // --------------------------------------------------

    function handleLogout() {

    // Clear authentication information.
    setUser(null);
    setToken(null);

    // Reset navigation for the next login.
    setActiveMenu("dashboard");
}

    // --------------------------------------------------
    // VERIFY AUTHENTICATION TOKEN
    // --------------------------------------------------
    // Send our JWT to Express.
    //
    // Express will:
    // 1. Verify the JWT signature and expiration.
    // 2. Check the user account in MySQL.
    // 3. Return the authenticated user's information.
    //
    // We display only the username and role.
    // Never display or log the JWT.
    // --------------------------------------------------

    async function handleVerifyToken() {
        try {
            const data = await getAuthenticatedUser(token);

            alert(
                `JWT verification successful!\n` +
                `Username: ${data.user.username}\n` +
                `Role: ${data.user.role}`
            );

        } catch (error) {
            alert(`JWT verification failed: ${error.message}`);
        }
    }
    // ==================================================
    // TEMPORARY TEST: AUTHENTICATED METER READINGS
    // ==================================================
    //
    // PURPOSE:
    // Verify that our React JWT can successfully
    // retrieve meter readings from Express.
    //
    // This function does not modify database records.
    // ==================================================

    async function handleTestReadings() {

        try {

            // Send our React authentication token to Express.
            const response = await fetch(
                "http://localhost:3000/api/readings",
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Convert the server response to JSON.
            const data = await response.json();

            // Display the HTTP response status.
            console.log("Readings HTTP Status:", response.status);

            // Handle unsuccessful requests.
            if (!response.ok) {
                alert(`Readings API failed: ${data.message}`);
                return;
            }

            // Display the returned records in Chrome Console.
            console.table(data.readings);

            // Display a confirmation message.
            alert(
                `Meter Readings API Test Successful!\n\n` +
                `HTTP Status: ${response.status}\n` +
                `Total Readings: ${data.count}`
            );

        } catch (error) {

            console.error("Readings test error:", error);

            alert(`Readings API error: ${error.message}`);
        }
    }

    // ==================================================
    // TEMPORARY TEST: INITIAL READING VALIDATION
    // ==================================================
    //
    // PURPOSE:
    // Verify that the backend rejects an invalid
    // opening meter reading.
    //
    // EXPECTED:
    // HTTP 400 Bad Request.
    //
    // SAFETY:
    // The submitted reading is negative.
    // Our backend must reject it before any INSERT.
    // ==================================================

    async function handleTestInitialValidation() {

        try {

            // Submit an intentionally invalid reading.
            const response = await fetch(
                "http://localhost:3000/api/readings/initial",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    // ==================================================
                    // TEST: REGISTER A VALID INITIAL READING
                    // ==================================================
                    //
                    // Meter: 12345678
                    // Installation date: 2026-10-17
                    // Opening reading: 100 m³
                    //
                    // Expected result:
                    // HTTP 201 Created.
                    //
                    // WARNING:
                    // This test creates a permanent database record.
                    // ==================================================

                    body: JSON.stringify({
                        meter_serial: "12345678",
                        reading_date: "2026-10-17",
                        reading_value: 100
                    })
                }
            );

            // Read the server response.
            const data = await response.json();

            // Display the HTTP result.
            console.log(
                "Initial Reading Validation HTTP Status:",
                response.status
            );

            console.log(
                "Validation message:",
                data.message
            );

            // Verify the expected rejection.
            if (response.status === 201) {

                alert(
                    "Initial Reading Registration PASSED!\n\n" +
                    "HTTP Status: 201\n" +
                    "Open meter reading successfully saved."
                );

            } else {

                alert(
                    "Unexpected validation result!\n\n" +
                    `HTTP Status: ${response.status}\n` +
                    `Message: ${data.message}`
                );
            }

        } catch (error) {

            console.error(
                "Initial reading validation test error:",
                error
            );

            alert(error.message);
        }
    }

    // --------------------------------------------------
    // DISPLAY LOGIN PAGE
    // --------------------------------------------------
    // If nobody is logged in, show Login.jsx.
    // --------------------------------------------------

    if (!user) {
        return (
            <Login onLoginSuccess={handleLoginSuccess} />
        );
    }

    // --------------------------------------------------
    // DISPLAY AUTHENTICATED USER
    // --------------------------------------------------
    // Temporary welcome screen.
    //
    // We will replace this with role-based dashboards
    // after connecting Login.jsx to our App state.
    // --------------------------------------------------

    // ==================================================
    // AUTHENTICATED APPLICATION DASHBOARD
    // ==================================================
    // Layout:
    // 1. Header — title, user details and session buttons.
    // 2. Navigation — role-based menu.
    // 3. Content — selected dashboard module.
    //
    // Existing authentication and CRUD logic is preserved.
    // ==================================================

    return (
        <main className="container-fluid dashboard-layout mt-3">

            {/* ==========================================
                DASHBOARD HEADER
            ========================================== */}

            <header className="dashboard-header">

                <h1>💧 Community Water Billing System</h1>

                <h2>Welcome, {user.username}!</h2>

                <p className="mb-3">
                    Your role: <strong>{user.role}</strong>
                </p>

                {/* Verify the existing JWT with Express. */}
                <button
                    className="btn btn-success me-2"
                    onClick={handleVerifyToken}
                >
                    🔐 Verify JWT
                </button>

            {/* ============================================== */}
            {/* TEMPORARY METER READINGS API TEST BUTTON       */}
            {/* ============================================== */}

            {user.role === "ADMIN" && (
                <button
                    type="button"
                    className="btn btn-primary ms-2"
                    onClick={handleTestReadings}
                >
                    📊 Test Readings API
                </button>
            )}

            {/* ============================================== */}
            {/* TEMPORARY INITIAL READING VALIDATION BUTTON    */}
            {/* ============================================== */}

            {user.role === "ADMIN" && (
                <button
                    type="button"
                    className="btn btn-warning ms-2"
                    onClick={handleTestInitialValidation}
                >
                    🧪 Test Initial Validation
                </button>
            )}

            {/* End the current authenticated session. */}
                <button
                    className="btn btn-danger"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </header>

            {/* ==========================================
                RESPONSIVE DASHBOARD BODY
            ========================================== */}

            <div className="dashboard-body">

                {/* --------------------------------------
                    ROLE-BASED NAVIGATION
                -------------------------------------- */}

                <nav className="dashboard-navigation">

                    <DashboardSidebar
                        role={user.role}
                        activeMenu={activeMenu}
                        onMenuChange={setActiveMenu}
                    />

                </nav>

                {/* --------------------------------------
                    SELECTED DASHBOARD CONTENT
                -------------------------------------- */}

                <section className="dashboard-content">

                    {/* Dashboard home for all three roles. */}
                    {activeMenu === "dashboard" && (
                        <DashboardHome user={user} />
                    )}

                    {/* ==================================================
                        PLACEHOLDERS FOR UNFINISHED MODULES
                    ================================================== */}

                    {activeMenu !== "dashboard" &&

                        // Customer management has been implemented.
                        !(user.role === "ADMIN" &&
                        activeMenu === "customers") &&

                        // Meter Readings is implemented for ADMIN/MANAGER.
                        !(
                            (user.role === "ADMIN" ||
                            user.role === "MANAGER") &&
                            activeMenu === "readings"
                        ) &&

                        // Bills is implemented for ADMIN/MANAGER.
                        !(
                            (user.role === "ADMIN" ||
                            user.role === "MANAGER") &&
                            activeMenu === "bills"
                        ) && (

                            <FeaturePlaceholder activeMenu={activeMenu} />

                        )
                    }

                    {/* ADMIN: Create customer records. */}
                    {user.role === "ADMIN" &&
                        activeMenu === "customers" && (
                            <CustomerForm token={token} />
                        )
                    }

                    {/* ADMIN: View and manage customers. */}
                    {user.role === "ADMIN" &&
                        activeMenu === "customers" && (
                            <CustomerList token={token} />
                        )
                    }

                    {/* ==========================================
                    ADMIN: METER REGISTRATION AND LIST
                    ========================================== */}

                    {user.role === "ADMIN" &&
                    activeMenu === "meters" && (

                        <>
                            {/* ADMIN: Register a new water meter. */}
                            <MeterForm
                                token={token}
                                onMeterCreated={() => {
                                    // Increment the counter after a successful save.
                                    setMeterRefreshKey((previous) => previous + 1);
                                }}
                            />

                            {/* Reload the list whenever a meter is registered. */}
                            <MeterList
                                token={token}
                                key={meterRefreshKey}
                            />
                        </>
                        )
                    }

                    {/* ==================================================
                        METER READINGS HISTORY
                    ================================================== */}

                    {/* ==================================================
                        METER READINGS REGISTRATION AND HISTORY
                    ================================================== */}

                    {(user.role === "ADMIN" ||
                    user.role === "MANAGER") &&

                        activeMenu === "readings" && (

                            <div>

                                {/* ADMIN can register readings. */}
                                {user.role === "ADMIN" && (

                                    <ReadingForm
                                        token={token}
                                        onSaved={() => {
                                            setReadingsRefreshKey(key => key + 1);
                                        }}
                                    />

                                )}

                                {/* ADMIN and MANAGER can view history. */}
                                <ReadingList
                                    key={readingsRefreshKey}
                                    token={token}
                                />

                            </div>

                        )
                    }

                {/* ==================================================
                    BILLS REGISTRATION AND INVOICE HISTORY
                ================================================== */}

                {(user.role === "ADMIN" ||
                user.role === "MANAGER") &&

                    activeMenu === "bills" && (

                        <div>

                            {/* ADMIN can generate invoices. */}
                            {user.role === "ADMIN" && (

                                <BillForm
                                    token={token}
                                    onSaved={() => {
                                        setBillsRefreshKey(key => key + 1);
                                    }}
                                />

                            )}

                            {/* ADMIN and MANAGER can view invoices. */}
                            <BillList
                                key={billsRefreshKey}
                                token={token}
                            />

                        </div>
                    )
                }
                </section>

            </div>

        </main>
    );
}

export default App;