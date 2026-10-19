// --------------------------------------------------
// LOGIN PAGE COMPONENT
// Community Water Billing System
// --------------------------------------------------
// This component displays the login form.
//
// It uses React's useState hook to manage:
// 1. The username entered by the user.
// 2. The password entered by the user.
//
// Later, we will connect this form to our Express
// backend using our authentication service.
// --------------------------------------------------

import { useState } from "react";

// --------------------------------------------------
// IMPORT AUTHENTICATION SERVICE
// --------------------------------------------------
// loginUser() sends the username and password
// to our Express authentication endpoint.
// --------------------------------------------------

import { loginUser } from "../services/authService";

// Receive the login-success function from App.jsx.
// This allows Login.jsx to update the parent component.
function Login({ onLoginSuccess }) {

    // --------------------------------------------------
    // FORM STATE
    // --------------------------------------------------
    // These variables store the values entered into
    // our username and password input fields.
    // --------------------------------------------------

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // --------------------------------------------------
    // LOGIN FORM SUBMISSION
    // --------------------------------------------------
    // This function:
    // 1. Prevents the browser from refreshing.
    // 2. Sends credentials to our Express API.
    // 3. Handles successful authentication.
    // 4. Displays errors when authentication fails.
    //
    // async allows us to use await for API requests.
    // --------------------------------------------------

    async function handleLogin(event) {
        event.preventDefault();

        try {

            // Send credentials to our authentication service.
            const data = await loginUser(username, password);

        // --------------------------------------------------
        // SUCCESSFUL AUTHENTICATION
        // --------------------------------------------------
        // Express has verified the username and password.
        //
        // Clear the password from the form's React state.
        // Never display or log the JWT token.
        //
        // Notify App.jsx that authentication succeeded.
        // App.jsx will update its user state and display
        // the authenticated welcome screen.
        // --------------------------------------------------

        // Clear the password after successful login.
        setPassword("");

        // Send the complete authentication response to App.jsx.
        //
        // This includes:
        // 1. The authenticated user.
        // 2. The JWT authentication token.
        //
        // Never display or log the token.
        onLoginSuccess(data);

        } catch (error) {

            // Display a meaningful authentication error.
            alert(error.message);

        }
    }

    // --------------------------------------------------
    // LOGIN PAGE INTERFACE
    // --------------------------------------------------

        return (
        <section className="login-page container py-5">

            {/* ==========================================
                APPLICATION HEADING
                ========================================== */}
            <h1 className="text-center mb-3">
                💧 Community Water Billing System
            </h1>

            <p className="text-center mb-4">
                Welcome! Please log in to access your account.
            </p>

            {/* ==========================================
                CENTERED LOGIN CARD
                ==========================================
                mx-auto centers the card horizontally.
                maxWidth prevents the form from stretching.
                Bootstrap card adds a clean presentation.
            ========================================== */}
            <div
                className="card shadow-sm mx-auto"
                style={{ maxWidth: "480px" }}
            >

                <div className="card-body p-4">

                    <h3 className="card-title text-center mb-4">
                        🔐 Account Login
                    </h3>

                    {/* ======================================
                        LOGIN FORM
                        Existing authentication logic preserved.
                    ====================================== */}
                    <form onSubmit={handleLogin}>

                        {/* ======================================
                            USERNAME FIELD - HORIZONTAL LAYOUT
                        ====================================== */}

                        <div className="row align-items-center mb-3">

                            {/* Username label - left side. */}
                            <label
                                htmlFor="username"
                                className="col-sm-3 col-form-label"
                            >
                                Username:
                            </label>

                            {/* Username input - right side. */}
                            <div className="col-sm-9">

                                <input
                                    type="text"
                                    id="username"
                                    className="form-control"
                                    value={username}
                                    onChange={(event) =>
                                        setUsername(event.target.value)
                                    }
                                    autoComplete="username"
                                    required
                                />

                            </div>

                        </div>


                        {/* ======================================
                            PASSWORD FIELD - HORIZONTAL LAYOUT
                        ====================================== */}

                        <div className="row align-items-center mb-4">

                            {/* Password label - left side. */}
                            <label
                                htmlFor="password"
                                className="col-sm-3 col-form-label"
                            >
                                Password:
                            </label>

                            {/* Password input - right side. */}
                            <div className="col-sm-9">

                                <input
                                    type="password"
                                    id="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    required
                                />

                            </div>

                        </div>

                        {/* CENTERED LOGIN BUTTON */}
                        <div className="text-center">

                            <button
                                type="submit"
                                className="btn btn-primary px-5"
                            >
                                🔐 Login
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </section>
    );
}

export default Login;