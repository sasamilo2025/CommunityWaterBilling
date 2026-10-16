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

    return (
        <main className="container mt-5">

    {/* ----------------------------------------------
    ROLE-BASED DASHBOARD SIDEBAR
    ----------------------------------------------
    Display the correct navigation menu based
    on the authenticated user's role.
---------------------------------------------- */}

<DashboardSidebar
    role={user.role}
    activeMenu={activeMenu}
    onMenuChange={setActiveMenu}
/>
            <h1>💧 Community Water Billing System</h1>

            <h2>Welcome, {user.username}!</h2>

            <p>
                Your role: <strong>{user.role}</strong>
            </p>

        {/* ----------------------------------------------
            JWT AUTHENTICATION TEST
            ----------------------------------------------
            This temporary button verifies that our
            protected Express endpoint accepts the JWT.
        ---------------------------------------------- */}

        <button
            className="btn btn-success me-2"
            onClick={handleVerifyToken}
        >
            🔐 Verify JWT
        </button>

            <button
                className="btn btn-danger"
                onClick={handleLogout}
            >
                Logout
            </button>

            {/* ==============================================
            DASHBOARD HOME — ALL THREE ROLES
            ==============================================

            PURPOSE:
            Display the appropriate dashboard welcome
            panel when the Dashboard menu is selected.

            DashboardHome reads the authenticated user's
            role and displays the correct information.

            This does not interfere with customer CRUD.
        ============================================== */}

        {activeMenu === "dashboard" && (
            <DashboardHome user={user} />
        )}

        {/* ==============================================
            UNFINISHED DASHBOARD MODULES
            ==============================================

            Display a placeholder when the selected menu
            does not yet have a working application module.

            EXCEPTIONS:
            - Dashboard uses DashboardHome.
            - ADMIN Customers uses CustomerForm and
            CustomerList.

            All other menus currently use the placeholder.
        ============================================== */}

        {activeMenu !== "dashboard" &&
            !(user.role === "ADMIN" && activeMenu === "customers") && (
                <FeaturePlaceholder activeMenu={activeMenu} />
            )}

        {/* ----------------------------------------------
        ADMIN CUSTOMER MANAGEMENT
        ----------------------------------------------
        Display the customer entry form only when
        the authenticated user has the ADMIN role.

        Pass our existing JWT to CustomerForm.
        Express independently verifies authorization.
    ---------------------------------------------- */}

    {/* ----------------------------------------------
    ADMIN CUSTOMER CREATION
    ----------------------------------------------
    Show the customer entry form only when:
    1. The authenticated user is ADMIN.
    2. The Customers menu is selected.
    ---------------------------------------------- */}

    {user.role === "ADMIN" && activeMenu === "customers" && (
        <CustomerForm token={token} />
    )}

    {/* ==========================================
        CUSTOMER READ OPERATION
        Display customer records for ADMIN users.
    ========================================== */}

    {/* ----------------------------------------------
    ADMIN CUSTOMER RECORDS
    ----------------------------------------------
    Display customer records only when ADMIN
    selects the Customers navigation menu.

    Existing CRUD functionality is preserved.
    ---------------------------------------------- */}

    {user.role === "ADMIN" && activeMenu === "customers" && (
        <CustomerList token={token} />
    )}

        </main>
    );
}

export default App;