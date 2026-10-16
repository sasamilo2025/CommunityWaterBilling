// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CUSTOMER LIST — READ AND UPDATE
// ==================================================
//
// PURPOSE:
// 1. Retrieve customers from Express.
// 2. Display customer records in a table.
// 3. Allow ADMIN to edit existing customers.
// 4. Refresh the table after successful updates.
//
// SECURITY:
// Every API request includes the authenticated JWT.
// Express independently enforces ADMIN permissions.
//
// ==================================================

import { useEffect, useState } from "react";

import {
    getCustomers,
    updateCustomer,

    // Send ACTIVE/INACTIVE changes to Express.
    updateCustomerStatus

} from "../services/customerService";

function CustomerList({ token }) {

    // ==================================================
    // COMPONENT STATE
    // ==================================================

    // Store customers retrieved from MySQL.
    const [customers, setCustomers] = useState([]);

    // Track customer list loading and errors.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Store the customer currently being edited.
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Store the values entered into the Edit form.
    const [editForm, setEditForm] = useState(null);

    // Track UPDATE requests and feedback.
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [editError, setEditError] = useState("");

    // ==================================================
    // CUSTOMER STATUS CHANGE STATE
    // ==================================================

    // Remember which customer is currently having
    // their ACTIVE/INACTIVE status updated.
    //
    // null = No status update is currently running.
    // customer_id = A status update is in progress.
    //
    // This will help us prevent repeated requests
    // while Express communicates with MySQL.

    const [changingStatusId, setChangingStatusId] = useState(null);

    // ==================================================
    // LOAD CUSTOMERS
    // ==================================================

    useEffect(() => {

        // Avoid state updates after unmounting.
        let cancelled = false;

        async function loadCustomers() {

            setLoading(true);
            setError("");

            try {

                // Retrieve customers from Express.
                const data = await getCustomers(token);

                if (!cancelled) {
                    setCustomers(data.customers);
                }

            } catch (err) {

                if (!cancelled) {
                    setError(err.message);
                }

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadCustomers();

        return () => {
            cancelled = true;
        };

    }, [token]);

    // ==================================================
    // START EDITING A CUSTOMER
    // ==================================================

    function handleEdit(customer) {

        // Remember which customer is being edited.
        setEditingCustomer(customer);

        // Populate the form with existing values.
        setEditForm({
            customer_no: customer.customer_no,
            first_name: customer.first_name,
            last_name: customer.last_name,
            address: customer.address,
            phone: customer.phone || "",
            email: customer.email || ""
        });

        // Clear previous feedback.
        setMessage("");
        setEditError("");
    }

    // ==================================================
    // HANDLE EDIT FORM INPUT
    // ==================================================

    function handleEditChange(event) {

        const { name, value } = event.target;

        // Update only the field being changed.
        setEditForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    // ==================================================
    // VALIDATE EDIT FORM
    // ==================================================

    // Customer number must contain three uppercase
    // letters followed by two digits.
    const validCustomerNumber =
        editForm !== null &&
        /^[A-Z]{3}[0-9]{2}$/.test(editForm.customer_no);

    // Required fields cannot be empty.
    const requiredFieldsComplete =
        editForm !== null &&
        editForm.first_name.trim() !== "" &&
        editForm.last_name.trim() !== "" &&
        editForm.address.trim() !== "";

    // Email is optional but must be valid if entered.
    const validEmail =
        editForm !== null &&
        (
            editForm.email.trim() === "" ||
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)
        );

    // Check maximum field lengths.
    const validLengths =
        editForm !== null &&
        editForm.first_name.length <= 50 &&
        editForm.last_name.length <= 50 &&
        editForm.address.length <= 255 &&
        editForm.phone.length <= 20 &&
        editForm.email.length <= 100;

    // Save is enabled only when all checks pass.
    const editFormValid =
        validCustomerNumber &&
        requiredFieldsComplete &&
        validEmail &&
        validLengths;

    // ==================================================
    // SAVE CUSTOMER CHANGES
    // ==================================================

    async function handleSaveChanges(event) {

        event.preventDefault();

        // Prevent invalid or repeated submissions.
        if (!editFormValid || saving || !editingCustomer) {
            return;
        }

        setSaving(true);
        setEditError("");
        setMessage("");

        try {

            // Send the UPDATE request to Express.
            await updateCustomer(
                editingCustomer.customer_id,
                editForm,
                token
            );

            // Retrieve the latest records from MySQL.
            const data = await getCustomers(token);

            // Update the React customer table.
            setCustomers(data.customers);

            // Close the editing form.
            setEditingCustomer(null);
            setEditForm(null);

            // Display confirmation.
            setMessage("Customer updated successfully!");

        } catch (err) {

            // Display errors without closing the form.
            setEditError(err.message);

        } finally {

            setSaving(false);
        }
    }

    // ==================================================
    // CANCEL EDITING
    // ==================================================

    function handleCancelEdit() {

        // Do not interrupt an active UPDATE request.
        if (saving) {
            return;
        }

        setEditingCustomer(null);
        setEditForm(null);
        setEditError("");
    }

    // ==================================================
    // CHANGE CUSTOMER STATUS
    // ==================================================
    //
    // PURPOSE:
    // Allow ADMIN to activate or deactivate a customer.
    //
    // SECURITY:
    // Express verifies the JWT and ADMIN permissions.
    //
    // IMPORTANT:
    // Customer records are NOT deleted.
    // Existing meters, readings, bills and payments
    // remain preserved in MySQL.
    //
    // ==================================================

    async function handleChangeStatus(customer) {

        // Determine the customer's next status.
        const newStatus =
            customer.status === "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE";

        // Ask ADMIN to confirm the requested change.
        const confirmed = window.confirm(
            `Are you sure you want to change customer ` +
            `${customer.customer_no} to ${newStatus}?`
        );

        // Stop if ADMIN cancels the operation.
        if (!confirmed) {
            return;
        }

        // Prevent overlapping status changes or edits.
        if (changingStatusId !== null || saving) {
            return;
        }

        // Record which customer is being updated.
        setChangingStatusId(customer.customer_id);

        // Clear previous feedback messages.
        setMessage("");
        setError("");

        try {

            // Send authenticated PATCH request to Express.
            await updateCustomerStatus(
                customer.customer_id,
                newStatus,
                token
            );

            // Retrieve the latest customer records from MySQL.
            const data = await getCustomers(token);

            // Refresh the React customer table.
            setCustomers(data.customers);

            // Display confirmation to ADMIN.
            setMessage(
                `Customer ${customer.customer_no} ` +
                `successfully changed to ${newStatus}!`
            );

        } catch (err) {

            // Display errors returned by Express.
            setError(err.message);

        } finally {

            // Allow further status changes.
            setChangingStatusId(null);

        }
    }

    // ==================================================
    // RENDER CUSTOMER LIST
    // ==================================================

    return (

        <section className="card p-4 mt-4">

            <h2>👥 Customer Records</h2>

            {/* Display successful UPDATE confirmation. */}
            {message && (
                <p className="alert alert-success">
                    ✅ {message}
                </p>
            )}

            {/* Display loading status. */}
            {loading && <p>Loading customers...</p>}

            {/* Display customer retrieval errors. */}
            {error && (
                <p className="alert alert-danger">
                    {error}
                </p>
            )}

            {/* ==========================================
                CUSTOMER TABLE
            ========================================== */}

            {!loading && !error && (

                <div className="table-responsive">

                    <table className="table table-striped">

                        <thead>
                            <tr>
                                <th>Customer No.</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Address</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>

                            {customers.map((customer) => (

                                <tr key={customer.customer_id}>

                                {/* Display customer information from MySQL. */}
                                <td>{customer.customer_no}</td>

                                <td>{customer.first_name}</td>

                                <td>{customer.last_name}</td>

                                <td>{customer.address}</td>

                                <td>{customer.phone || "-"}</td>

                                <td>{customer.email || "-"}</td>

                                {/* ==========================================
                                    CUSTOMER STATUS
                                    Display ACTIVE or INACTIVE from MySQL.
                                ========================================== */}

                                <td>
                                    {/* ==========================================
                                        CUSTOMER STATUS BADGE

                                        ACTIVE   = Green background
                                        INACTIVE = Grey background

                                        Inline styles ensure the badge displays
                                        correctly even without Bootstrap CSS.
                                    ========================================== */}

                                    <span
                                        style={{
                                            // Select background colour by status.
                                            backgroundColor:
                                                customer.status === "ACTIVE"
                                                    ? "#198754"
                                                    : "#6c757d",

                                            // White text for contrast.
                                            color: "#ffffff",

                                            // Space inside the badge.
                                            padding: "5px 10px",

                                            // Rounded badge corners.
                                            borderRadius: "6px",

                                            // Keep text compact.
                                            fontSize: "12px",

                                            // Make the status easy to read.
                                            fontWeight: "bold",

                                            // Keep badge on one line.
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {customer.status || "UNKNOWN"}
                                    </span>
                                </td>

                                {/* ==========================================
                                    CUSTOMER ACTION BUTTONS
                                    ========================================== */}

                                <td>

                                    {/* EDIT CUSTOMER BUTTON */}
                                    <button
                                        type="button"
                                        className="btn btn-warning btn-sm me-2"
                                        disabled={saving || changingStatusId !== null}
                                        onClick={() => handleEdit(customer)}
                                    >
                                        ✏️ Edit
                                    </button>

                                    {/* ACTIVATE / DEACTIVATE CUSTOMER BUTTON */}
                                    <button
                                        type="button"

                                        // Display different colours depending
                                        // on the customer's current status.
                                        className={`btn btn-sm ${
                                            customer.status === "ACTIVE"
                                                ? "btn-secondary"
                                                : "btn-success"
                                        }`}

                                        // Prevent repeated requests while
                                        // an update is being processed.
                                        disabled={saving || changingStatusId !== null}

                                        // Call our status-change handler.
                                        onClick={() => handleChangeStatus(customer)}
                                    >

                                        {/* Display the appropriate button label. */}
                                        {changingStatusId === customer.customer_id
                                            ? "⏳ Updating..."
                                            : customer.status === "ACTIVE"
                                                ? "⚪ Deactivate"
                                                : "🟢 Activate"}

                                    </button>

                                </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                    {customers.length === 0 && (
                        <p>No customers found.</p>
                    )}

                </div>

            )}

            {/* ==========================================
                EDIT CUSTOMER FORM
            ========================================== */}

            {editingCustomer && editForm && (

                <div className="card p-4 mt-4">

                    <h3>
                        ✏️ Edit Customer:
                        {" "}
                        {editingCustomer.customer_no}
                    </h3>

                    <p>
                        Update customer details below.
                    </p>

                    <form onSubmit={handleSaveChanges}>

                        <div className="row g-3">

                            {/* CUSTOMER NUMBER */}
                            <div className="col-md-4">

                                <label className="form-label">
                                    Customer Number
                                </label>

                                <input
                                    type="text"
                                    name="customer_no"
                                    className="form-control"
                                    value={editForm.customer_no}
                                    onChange={handleEditChange}
                                    maxLength={5}
                                    required
                                />

                            </div>

                            {/* FIRST NAME */}
                            <div className="col-md-4">

                                <label className="form-label">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    name="first_name"
                                    className="form-control"
                                    value={editForm.first_name}
                                    onChange={handleEditChange}
                                    maxLength={50}
                                    required
                                />

                            </div>

                            {/* LAST NAME */}
                            <div className="col-md-4">

                                <label className="form-label">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    name="last_name"
                                    className="form-control"
                                    value={editForm.last_name}
                                    onChange={handleEditChange}
                                    maxLength={50}
                                    required
                                />

                            </div>

                            {/* ADDRESS */}
                            <div className="col-md-6">

                                <label className="form-label">
                                    Address
                                </label>

                                <input
                                    type="text"
                                    name="address"
                                    className="form-control"
                                    value={editForm.address}
                                    onChange={handleEditChange}
                                    maxLength={255}
                                    required
                                />

                            </div>

                            {/* PHONE */}
                            <div className="col-md-3">

                                <label className="form-label">
                                    Phone
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    className="form-control"
                                    value={editForm.phone}
                                    onChange={handleEditChange}
                                    maxLength={20}
                                />

                            </div>

                            {/* EMAIL */}
                            <div className="col-md-3">

                                <label className="form-label">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    maxLength={100}
                                />

                            </div>

                        </div>

                        {/* Display UPDATE errors. */}
                        {editError && (
                            <p className="alert alert-danger mt-3">
                                {editError}
                            </p>
                        )}

                        {/* SAVE CHANGES BUTTON */}
                        <button
                            type="submit"
                            className={`btn mt-4 ${
                                editFormValid
                                    ? "btn-success"
                                    : "btn-secondary"
                            }`}
                            disabled={!editFormValid || saving}
                        >
                            {saving
                                ? "⏳ Saving Changes..."
                                : "💾 Save Changes"}
                        </button>

                        {/* CANCEL BUTTON */}
                        <button
                            type="button"
                            className="btn btn-secondary mt-4 ms-2"
                            disabled={saving}
                            onClick={handleCancelEdit}
                        >
                            ❌ Cancel
                        </button>

                    </form>

                </div>

            )}

        </section>
    );
}

export default CustomerList;