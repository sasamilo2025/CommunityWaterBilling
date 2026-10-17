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

                    {/* Placeholder for unfinished modules. */}
                    {activeMenu !== "dashboard" &&
                        !(user.role === "ADMIN" && activeMenu === "customers") &&
                        !(user.role === "ADMIN" && activeMenu === "meters") && (
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

                    {/* ADMIN: View registered water meters. */}
                    {user.role === "ADMIN" &&
                        activeMenu === "meters" && (
                            <MeterList token={token} />
                        )
                    }

                </section>

            </div>

        </main>
    );
}

export default App;