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
    // HANDLE SUCCESSFUL LOGIN
    // --------------------------------------------------
    // Receive the authenticated user and JWT from
    // Login.jsx.
    //
    // Both values remain in React memory.
    // --------------------------------------------------

    function handleLoginSuccess(loginData) {
        setToken(loginData.token);
        setUser(loginData.user);
    }

    // --------------------------------------------------
    // HANDLE LOGOUT
    // --------------------------------------------------
    // Clear the authenticated user and JWT from memory.
    // --------------------------------------------------

    function handleLogout() {
        setUser(null);
        setToken(null);
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

        {/* ----------------------------------------------
        ADMIN CUSTOMER MANAGEMENT
        ----------------------------------------------
        Display the customer entry form only when
        the authenticated user has the ADMIN role.

        Pass our existing JWT to CustomerForm.
        Express independently verifies authorization.
    ---------------------------------------------- */}

    {user.role === "ADMIN" && (
        <CustomerForm token={token} />
    )}

    {/* ==========================================
        CUSTOMER READ OPERATION
        Display customer records for ADMIN users.
    ========================================== */}

    {user.role === "ADMIN" && (
        <CustomerList token={token} />
    )}

        </main>
    );
}

export default App;