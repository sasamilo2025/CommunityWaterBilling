// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER READING REGISTRATION FORM
// ==================================================
//
// ADMIN ONLY.
//
// INITIAL:
// - Opening meter reading.
// - Reading date must match installation date.
// - Does not generate an invoice.
//
// MONTHLY:
// - Records actual physical reading date.
// - Stores a separate billing month.
// - Suggests the next month where history exists.
// - Requires ADMIN billing-month confirmation.
//
// ==================================================

import { useEffect, useState } from "react";

import { getMeters } from "../services/meterService";

import { getReadings,
         registerInitialReading,
         registerMonthlyReading
} from "../services/readingService";


// ==================================================
// FORMAT METER NUMBER FOR DISPLAY
// ==================================================

function formatMeterNumber(serial) {

    const value = String(serial || "");

    return value.length === 8
        ? `${value.slice(0, 4)}-${value.slice(4)}`
        : value;
}


// ==================================================
// GET NEXT BILLING MONTH
// ==================================================
//
// Example:
// 2026-09-01 → 2026-10-01
//
// UTC avoids timezone-related date shifting.
// ==================================================

function nextBillingMonth(billingMonth) {

    const [year, month] =
        billingMonth.slice(0, 7).split("-").map(Number);

    return new Date(
        Date.UTC(year, month, 1)
    ).toISOString().slice(0, 10);
}


// ==================================================
// READING FORM COMPONENT
// ==================================================

function ReadingForm({ token, onSaved }) {

    const [meters, setMeters] = useState([]);

    const [readings, setReadings] = useState([]);

    const [meterSerial, setMeterSerial] = useState("");

    const [readingType, setReadingType] =
        useState("INITIAL");

    const [readingDate, setReadingDate] = useState("");

    const [readingValue, setReadingValue] = useState("");

    const [billingMonth, setBillingMonth] = useState("");

    const [confirmed, setConfirmed] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);

    // ==================================================
    // SUCCESSFUL SAVE CONTROL
    // ==================================================
    // Prevent accidental repeat submissions.
    //
    // ADMIN must select New Reading before entering
    // another reading after a successful save.
    // ==================================================

    const [saved, setSaved] = useState(false);


    // ==================================================
    // LOAD METERS AND READING HISTORY
    // ==================================================

    async function loadData() {

        try {

            const [meterData, readingData] =
                await Promise.all([
                    getMeters(token),
                    getReadings(token)
                ]);

            setMeters(meterData.meters || []);

            setReadings(readingData.readings || []);

        } catch (err) {

            setError(err.message);
        }
    }


    useEffect(() => {

        // Load existing records when form opens.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();

    }, [token]);


    // ==================================================
    // SELECTED METER AND ITS READINGS
    // ==================================================

    const selectedMeter = meters.find(
        meter => meter.meter_serial === meterSerial
    );

    const meterReadings = readings.filter(
        reading => reading.meter_serial === meterSerial
    );

    const initialReading = meterReadings.find(
        reading => reading.reading_type === "INITIAL"
    );

    const monthlyReadings = meterReadings
        .filter(reading => reading.reading_type === "MONTHLY")
        .sort((a, b) =>
            b.billing_month.localeCompare(a.billing_month)
        );

    const latestMonthly = monthlyReadings[0];


    // ==================================================
    // AUTOMATIC BILLING MONTH SUGGESTION
    // ==================================================

    useEffect(() => {

        if (readingType !== "MONTHLY") {
            return;
        }

        // Existing monthly history:
        // Suggest the following billing month.

        if (latestMonthly) {

            setBillingMonth(
                nextBillingMonth(latestMonthly.billing_month)
            );

        } else if (initialReading) {

            // First monthly reading:
            // Suggest installation/initial reading month.
            // ADMIN must review before confirmation.

            setBillingMonth(
                initialReading.reading_date.slice(0, 7) + "-01"
            );

        } else {

            setBillingMonth("");
        }

        // A newly suggested month must be confirmed.
        setConfirmed(false);

    }, [
        meterSerial,
        readingType,
        latestMonthly?.billing_month,
        initialReading?.reading_date
    ]);


    // ==================================================
    // RESET FORM AFTER SAVE
    // ==================================================

    function resetForm() {

        setMeterSerial("");
        setReadingType("INITIAL");
        setReadingDate("");
        setReadingValue("");
        setBillingMonth("");
        setConfirmed(false);
    }


    // ==================================================
    // SAVE READING
    // ==================================================

    async function handleSubmit(event) {

        event.preventDefault();

        setError("");
        setMessage("");

        if (!meterSerial) {
            setError("Please select a meter.");
            return;
        }

        if (!readingDate || readingValue === "") {
            setError("Reading date and value are required.");
            return;
        }

        const numericValue = Number(readingValue);

        if (!Number.isSafeInteger(numericValue) ||
            numericValue < 0 ||
            numericValue > 4294967295) {

            setError("Reading must be a valid non-negative whole number.");
            return;
        }

        if (readingType === "MONTHLY") {

            if (!billingMonth || !confirmed) {

                setError(
                    "Please review and confirm the billing month."
                );

                return;
            }
        }

        setSaving(true);

        try {

            const readingData = {
                meter_serial: meterSerial,
                reading_date: readingDate,
                reading_value: numericValue
            };

            let result;

            if (readingType === "INITIAL") {

                result = await registerInitialReading(
                    token,
                    readingData
                );

            } else {

                result = await registerMonthlyReading(
                    token,
                    {
                        ...readingData,
                        billing_month: billingMonth,
                        billing_month_confirmed: true
                    }
                );
            }

            // Display success confirmation.
            setMessage(result.message);

            // Clear the data-entry fields.
            resetForm();

            // Lock Save until ADMIN selects New Reading.
            setSaved(true);

            // Refresh available meter readings.
            await loadData();

            // Ask the parent to refresh Reading History.
            if (onSaved) {
                onSaved();
            }

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);
        }
    }


    // ==================================================
    // RENDER REGISTRATION FORM
    // ==================================================

    return (

        <section className="card shadow-sm mb-4">

            <div className="card-body">

                <h3 className="card-title mb-4 text-center">
                    📝 Meter Reading Registration
                </h3>

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                {/* ==================================================
                    TWO-COLUMN HORIZONTAL FORM LAYOUT
                ================================================== */}

                <div className="row g-4">

                    {/* ==============================================
                        LEFT COLUMN
                    ============================================== */}

                    <div className="col-md-6">

                        {/* METER NUMBER */}

                        <div className="row align-items-center mb-3">

                            <label className="col-sm-4 col-form-label">
                                Meter No:
                            </label>

                            <div className="col-sm-8">

                                <select
                                    className="form-select"
                                    value={meterSerial}
                                    onChange={event => {
                                        setMeterSerial(event.target.value);
                                        setConfirmed(false);
                                    }}
                                    required
                                >

                                    <option value="">
                                        Select Meter
                                    </option>

                                    {meters.map(meter => (

                                        <option
                                            key={meter.meter_serial}
                                            value={meter.meter_serial}
                                        >
                                            {formatMeterNumber(meter.meter_serial)}
                                        </option>

                                    ))}

                                </select>

                            </div>

                        </div>


                        {/* CUSTOMER NAME */}

                        <div className="row align-items-center mb-3">

                            <label className="col-sm-4 col-form-label">
                                Customer:
                            </label>

                            <div className="col-sm-8">

                                <input
                                    className="form-control"
                                    value={
                                        selectedMeter
                                            ? `${selectedMeter.first_name || ""} ${selectedMeter.last_name || ""}`.trim()
                                            : ""
                                    }
                                    readOnly
                                />

                            </div>

                        </div>


                        {/* READING VALUE */}

                        <div className="row align-items-center mb-3">

                            <label className="col-sm-4 col-form-label">
                                Reading (m³):
                            </label>

                            <div className="col-sm-8">

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="form-control"
                                    value={readingValue}
                                    onChange={event =>
                                        setReadingValue(event.target.value)
                                    }
                                    required
                                />

                            </div>

                        </div>

                    </div>


                    {/* ==============================================
                        RIGHT COLUMN
                    ============================================== */}

                    <div className="col-md-6">

                        {/* READING TYPE */}

                        <div className="row align-items-center mb-3">

                            <label className="col-sm-4 col-form-label">
                                Reading Type:
                            </label>

                            <div className="col-sm-8">

                                <select
                                    className="form-select"
                                    value={readingType}
                                    onChange={event => {
                                        setReadingType(event.target.value);
                                        setConfirmed(false);
                                    }}
                                >
                                    <option value="INITIAL">
                                        INITIAL
                                    </option>

                                    <option value="MONTHLY">
                                        MONTHLY
                                    </option>
                                </select>

                            </div>

                        </div>


                        {/* PHYSICAL READING DATE */}

                        <div className="row align-items-center mb-3">

                            <label className="col-sm-4 col-form-label">
                                Reading Date:
                            </label>

                            <div className="col-sm-8">

                                <input
                                    type="date"
                                    className="form-control"
                                    value={readingDate}
                                    onChange={event =>
                                        setReadingDate(event.target.value)
                                    }
                                    required
                                />

                            </div>

                        </div>


                        {/* BILLING MONTH — MONTHLY ONLY */}

                        {readingType === "MONTHLY" && (

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-4 col-form-label">
                                    Billing Month:
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        type="month"
                                        className="form-control"
                                        value={billingMonth.slice(0, 7)}
                                        onChange={event => {

                                            setBillingMonth(
                                                event.target.value
                                                    ? `${event.target.value}-01`
                                                    : ""
                                            );

                                            setConfirmed(false);
                                        }}
                                        required
                                    />

                                </div>

                            </div>
                        )}

                    </div>

                </div>


                    {/* ==================================================
                        ADMIN BILLING MONTH CONFIRMATION
                    ================================================== */}
                    {/* Display confirmation only for MONTHLY readings. */}

                    {readingType === "MONTHLY" && (

                        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">

                            {/* Confirmation message appears FIRST. */}
                            <label
                                className="form-label mb-0"
                                htmlFor="confirmBillingMonth"
                            >
                                I confirm this reading belongs to the selected billing month.
                            </label>

                            {/* Checkbox appears immediately AFTER the message. */}
                            <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                id="confirmBillingMonth"
                                checked={confirmed}
                                onChange={event =>
                                    setConfirmed(event.target.checked)
                                }
                            />

                        </div>

                    )}

                    {/* CENTERED SAVE BUTTON */}

                    <div className="text-center mt-4">

                        <button
                            type="submit"
                            className={`btn px-5 ${
                                saving
                                    ? "btn-warning"
                                    : saved
                                        ? "btn-secondary"
                                        : "btn-success"
                            }`}
                            disabled={saving || saved}
                        >
                            {saving
                                ? "⏳ Saving..."
                                : saved
                                    ? "✅ Reading Saved"
                                    : "💾 Save Meter Reading"}
                        </button>

                        {/* Allow ADMIN to begin another reading. */}
                        {saved && (

                            <button
                                type="button"
                                className="btn btn-primary ms-2 px-4"
                                onClick={() => {

                                    // Unlock the registration form.
                                    setSaved(false);

                                    // Clear previous success messages.
                                    setMessage("");
                                    setError("");

                                    // Ensure all fields are reset.
                                    resetForm();
                                }}
                            >
                                ➕ New Reading
                            </button>

                        )}

                    </div>

                </form>

            </div>

        </section>
    );
}

export default ReadingForm;