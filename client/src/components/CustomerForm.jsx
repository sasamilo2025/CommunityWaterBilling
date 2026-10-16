// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// ADD CUSTOMER FORM
// ==================================================
//
// PURPOSE:
// Allow ADMIN to create customer records.
//
// SECURITY:
// The JWT is supplied by App.jsx.
// Express verifies ADMIN authorization.
//
// ==================================================

import { useState } from "react";

// Import our customer API service.
import { createCustomer } from "../services/customerService";

// Initial values for our customer form.
const initialForm = {
    customer_no: "",
    first_name: "",
    last_name: "",
    address: "",
    phone: "",
    email: ""
};

function CustomerForm({ token }) {

    // Store the values entered into the form.
    const [formData, setFormData] = useState(initialForm);

    // Display success or error messages.
    const [message, setMessage] = useState("");

    // Track whether a request is being processed.
    const [loading, setLoading] = useState(false);

    // Track whether the customer was saved successfully.
    // Prevent another submission until New Customer is clicked.
    const [saved, setSaved] = useState(false);

// --------------------------------------------------
// VALIDATE CUSTOMER FORM
// --------------------------------------------------

// Customer number must contain three uppercase
// letters followed by two digits, e.g. CUS01.
const validCustomerNumber =
    /^[A-Z]{3}[0-9]{2}$/.test(formData.customer_no);

// Required text fields cannot be empty or whitespace.
const requiredFieldsComplete =
    formData.first_name.trim() !== "" &&
    formData.last_name.trim() !== "" &&
    formData.address.trim() !== "";

// Email is optional, but must be valid if provided.
const validEmail =
    formData.email.trim() === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

// All validation conditions must pass.
const formValid =
    validCustomerNumber &&
    requiredFieldsComplete &&
    validEmail;

    // ----------------------------------------------
    // HANDLE INPUT CHANGES
    // ----------------------------------------------
    function handleChange(event) {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    // ----------------------------------------------
    // HANDLE CUSTOMER SUBMISSION
    // ----------------------------------------------
    async function handleSubmit(event) {

        // Prevent the browser from refreshing.
        event.preventDefault();

        // Do not submit invalid, saved, or processing forms.
        if (!formValid || loading || saved) {
            return;
        }

        setMessage("");
        setLoading(true);

        try {

            // Send customer data and JWT to Express.
            const result = await createCustomer(
                formData,
                token
            );

            // Display successful insertion.
            setMessage(
                `Customer created successfully! ID: ${result.customer_id}`
            );

            // Lock the Save button after successful insertion.
            setSaved(true);

            // Clear the form after successful creation.
            setFormData({ ...initialForm });

        } catch (error) {

            // Display the API error message.
            setMessage(error.message);

        } finally {

            // Re-enable the Save button.
            setLoading(false);
        }
    }

    return (
        <section className="card shadow-sm mt-4">

            <div className="card-body">

                <h3 className="card-title">
                    👥 Add New Customer
                </h3>

                <p className="text-muted">
                    Enter customer information below.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="row g-3">

                        <div className="col-md-4">
                            <label className="form-label">
                                Customer Number
                            </label>

                            <input
                                className="form-control"
                                name="customer_no"
                                value={formData.customer_no}
                                onChange={handleChange}
                                placeholder="ABC12"
                                maxLength={5}
                                required
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">
                                First Name
                            </label>

                            <input
                                className="form-control"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                maxLength={50}
                                required
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">
                                Last Name
                            </label>

                            <input
                                className="form-control"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                maxLength={50}
                                required
                            />
                        </div>

                        <div className="col-md-12">
                            <label className="form-label">
                                Address
                            </label>

                            <input
                                className="form-control"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                maxLength={255}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Phone
                            </label>

                            <input
                                className="form-control"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                maxLength={20}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">
                                Email
                            </label>

                            <input
                                className="form-control"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                maxLength={100}
                            />
                        </div>

                    </div>

                    {/* ==========================================
                        CHANGE E — SMART SAVE BUTTON
                        ==========================================
                        Grey: Form invalid or already saved.
                        Green: Form valid and ready to save.
                        Yellow: Saving in progress.
                    ========================================== */}

                    <button
                        type="submit"
                        className={`btn mt-4 ${
                            loading
                                ? "btn-warning"
                                : saved || !formValid
                                    ? "btn-secondary"
                                    : "btn-success"
                        }`}
                        disabled={!formValid || loading || saved}
                    >
                        {loading
                            ? "⏳ Saving..."
                            : saved
                                ? "✅ Customer Saved"
                                : "💾 Save Customer"}
                    </button>

                    {/* Allow ADMIN to enter another customer. */}
                    {saved && (
                        <button
                            type="button"
                            className="btn btn-primary mt-4 ms-2"
                            onClick={() => {
                                setFormData({ ...initialForm });
                                setSaved(false);
                                setMessage("");
                            }}
                        >
                            ➕ New Customer
                        </button>
                    )}

                </form>

                {message && (
                    <div
                        className={`alert mt-3 ${
                            saved ? "alert-success" : "alert-danger"
                        }`}
                        role="status"
                    >
                        {message}
                    </div>
                )}

            </div>

        </section>
    );
}

export default CustomerForm;