// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// ADMIN METER REGISTRATION FORM
// ==================================================
//
// PURPOSE:
// 1. Register new water meters.
// 2. Load customer numbers from MySQL.
// 3. Display the selected customer's name.
// 4. Validate meter information.
// 5. Send registration data to Express.
//
// SECURITY:
// ADMIN ONLY.
// Express independently verifies the JWT and role.
//
// ==================================================

import { useEffect, useState } from "react";

import { getCustomers } from "../services/customerService";
import { createMeter } from "../services/meterService";


// ==================================================
// INITIAL FORM VALUES
// ==================================================

const initialForm = {
    meter_serial: "",
    customer_id: "",
    location: "",
    status: "ACTIVE",
    installed_at: ""
};


// ==================================================
// METER REGISTRATION COMPONENT
// ==================================================

function MeterForm({ token, onMeterCreated }) {

    // Store the form values.
    const [form, setForm] = useState({ ...initialForm });

    // Store customers retrieved from MySQL.
    const [customers, setCustomers] = useState([]);

    // Track loading and saving operations.
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [saving, setSaving] = useState(false);

    // Display messages to the ADMIN user.
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    // ==================================================
    // LOAD CUSTOMERS
    // ==================================================

    useEffect(() => {

        let cancelled = false;

        async function loadCustomers() {

            setLoadingCustomers(true);

            try {

                // Retrieve customers using our existing API.
                const data = await getCustomers(token);

                if (!cancelled) {

                    // Display all registered customers.
                    // Include ACTIVE and INACTIVE accounts.
                    // No customer records are changed.
                    setCustomers(data.customers);
                }

            } catch (err) {

                if (!cancelled) {
                    setError(err.message);
                }

            } finally {

                if (!cancelled) {
                    setLoadingCustomers(false);
                }
            }
        }

        loadCustomers();

        return () => {
            cancelled = true;
        };

    }, [token]);


    // ==================================================
    // HANDLE FORM CHANGES
    // ==================================================

    function handleChange(event) {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        // Clear previous messages when editing.
        setMessage("");
        setError("");
    }


    // ==================================================
    // FIND SELECTED CUSTOMER
    // ==================================================

    const selectedCustomer = customers.find(
        (customer) =>
            String(customer.customer_id) ===
            String(form.customer_id)
    );


    // ==================================================
    // SAVE NEW METER
    // ==================================================

    async function handleSubmit(event) {

        // Prevent browser page refresh.
        event.preventDefault();

        setMessage("");
        setError("");

        // Remove the display hyphen before validation.
        const serial = form.meter_serial.replace("-", "");

        // Meter numbers must contain exactly 8 digits.
        if (!/^[0-9]{8}$/.test(serial)) {
            setError("Meter number must contain exactly 8 digits.");
            return;
        }

        // A customer must be selected.
        if (!selectedCustomer) {
            setError("Please select a valid customer.");
            return;
        }

        // Location is required.
        if (!form.location.trim()) {
            setError("Please enter the meter location.");
            return;
        }

        setSaving(true);

        try {

            // Send registration information to Express.
            await createMeter(
                {
                    meter_serial: serial,
                    customer_id: Number(form.customer_id),
                    location: form.location.trim(),
                    status: form.status,
                    installed_at: form.installed_at || null
                },
                token
            );

            // Display successful registration.
            setMessage("Meter registered successfully!");

            // Reset form for the next meter.
            setForm({ ...initialForm });

            // Notify the parent component so the
            // meter list can refresh after saving.
            if (onMeterCreated) {
                onMeterCreated();
            }

        } catch (err) {

            // Display backend validation errors.
            setError(err.message);

        } finally {

            setSaving(false);
        }
    }


    // ==================================================
    // RENDER METER REGISTRATION FORM
    // ==================================================

    return (

        <section className="card shadow-sm mb-4">

            <div className="card-body">

                <h3 className="card-title mb-3">
                    💧 Register New Meter
                </h3>

                <p className="text-muted">
                    Assign a water meter to an existing customer.
                </p>

                {/* Success message. */}
                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {/* Error message. */}
                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="row g-4">

                        {/* ==================================
                            LEFT COLUMN
                        ================================== */}

                        <div className="col-12 col-lg-6">

                            {/* METER NUMBER */}
                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="meter_serial"
                                    className="col-sm-5 col-form-label"
                                >
                                    Meter Number:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        id="meter_serial"
                                        name="meter_serial"
                                        type="text"
                                        className="form-control"
                                        placeholder="1234-5678"
                                        value={form.meter_serial}
                                        onChange={handleChange}
                                        maxLength={9}
                                        required
                                    />

                                </div>
                            </div>

                            {/* CUSTOMER NUMBER */}
                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="customer_id"
                                    className="col-sm-5 col-form-label"
                                >
                                    Customer No:
                                </label>

                                <div className="col-sm-7">

                                    <select
                                        id="customer_id"
                                        name="customer_id"
                                        className="form-select"
                                        value={form.customer_id}
                                        onChange={handleChange}
                                        disabled={loadingCustomers}
                                        required
                                    >

                                        <option value="">
                                            Select customer
                                        </option>

                                        {customers.map((customer) => (

                                            <option
                                                key={customer.customer_id}
                                                value={customer.customer_id}
                                            >
                                                {customer.customer_no} ({customer.status})
                                            </option>

                                        ))}

                                    </select>

                                </div>
                            </div>

                            {/* CUSTOMER NAME */}
                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Customer Name:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            selectedCustomer
                                                ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
                                                : ""
                                        }
                                        placeholder="Selected customer name"
                                        readOnly
                                    />

                                </div>
                            </div>

                        </div>


                        {/* ==================================
                            RIGHT COLUMN
                        ================================== */}

                        <div className="col-12 col-lg-6">

                            {/* LOCATION */}
                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="location"
                                    className="col-sm-5 col-form-label"
                                >
                                    Location:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        className="form-control"
                                        value={form.location}
                                        onChange={handleChange}
                                        maxLength={255}
                                        required
                                    />

                                </div>
                            </div>

                            {/* STATUS */}
                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="status"
                                    className="col-sm-5 col-form-label"
                                >
                                    Status:
                                </label>

                                <div className="col-sm-7">

                                    <select
                                        id="status"
                                        name="status"
                                        className="form-select"
                                        value={form.status}
                                        onChange={handleChange}
                                    >
                                        <option value="ACTIVE">
                                            ACTIVE
                                        </option>

                                        <option value="INACTIVE">
                                            INACTIVE
                                        </option>
                                    </select>

                                </div>
                            </div>

                            {/* DATE INSTALLED */}
                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="installed_at"
                                    className="col-sm-5 col-form-label"
                                >
                                    Date Installed:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        id="installed_at"
                                        name="installed_at"
                                        type="date"
                                        className="form-control"
                                        value={form.installed_at}
                                        onChange={handleChange}
                                    />

                                </div>
                            </div>

                        </div>

                    </div>


                    {/* ==================================
                        SAVE BUTTON
                    ================================== */}

                    <div className="mt-3">

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving || loadingCustomers}
                        >
                            {saving
                                ? "Saving Meter..."
                                : "💾 Save Meter"}
                        </button>

                    </div>

                </form>

            </div>

        </section>
    );
}


// Export for use in App.jsx.
export default MeterForm;