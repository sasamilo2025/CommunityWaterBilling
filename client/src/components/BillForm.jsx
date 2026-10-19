// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CUSTOMER INVOICE REGISTRATION FORM
// ==================================================
//
// ACCESS:
// ADMIN only.
//
// PURPOSE:
// Generate invoices from MONTHLY meter readings.
//
// SECURITY:
// Express independently validates invoice creation.
//
// BUSINESS RULES:
// - INITIAL readings cannot be invoiced.
// - One invoice per MONTHLY reading.
// - Previous reading obtained from reading history.
// - Rate: $0.50 per cubic metre.
// - MySQL calculates actual invoice totals.
// - Payment due date: invoice date + 30 days.
//
// ==================================================

import { useEffect, useState } from "react";

import { getReadings } from "../services/readingService";

import { getBills, createBill } from "../services/billService";


// ==================================================
// FORMAT METER NUMBER
// ==================================================

function formatMeter(serial) {

    const value = String(serial || "");

    return value.length === 8
        ? `${value.slice(0, 4)}-${value.slice(4)}`
        : value;
}


// ==================================================
// FORMAT BILLING MONTH
// ==================================================

function formatMonth(value) {

    if (!value) return "";

    const [year, month] = String(value).slice(0, 7).split("-");

    const names = [
        "January", "February", "March",
        "April", "May", "June",
        "July", "August", "September",
        "October", "November", "December"
    ];

    return `${names[Number(month) - 1]} ${year}`;
}


// ==================================================
// FORMAT DATE FOR DISPLAY
// ==================================================

function formatDate(value) {

    if (!value) return "";

    const [year, month, day] =
        String(value).slice(0, 10).split("-");

    return `${day}/${month}/${year}`;
}


// ==================================================
// INVOICE REGISTRATION COMPONENT
// ==================================================

function BillForm({ token, onSaved }) {

    const [readings, setReadings] = useState([]);

    const [bills, setBills] = useState([]);

    const [meterSerial, setMeterSerial] = useState("");

    const [readingId, setReadingId] = useState("");

    const [invoiceNumber, setInvoiceNumber] = useState("");

    const [invoiceDate, setInvoiceDate] = useState("");

    const [loading, setLoading] = useState(false);

    const [saving, setSaving] = useState(false);

    const [saved, setSaved] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");


    // ==================================================
    // LOAD READINGS AND EXISTING INVOICES
    // ==================================================

    async function loadData() {

        setLoading(true);

        try {

            const [readingData, billData] =
                await Promise.all([
                    getReadings(token),
                    getBills(token)
                ]);

            setReadings(readingData.readings || []);

            setBills(billData.bills || []);

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);
        }
    }


    useEffect(() => {

        // Fetch existing data when the form opens.
        loadData();

    }, [token]);


    // ==================================================
    // FIND ELIGIBLE MONTHLY READINGS
    // ==================================================

    // Collect the IDs of readings already invoiced.
    const invoicedIds = new Set(
        bills.map(bill => Number(bill.reading_id))
    );

    // Only MONTHLY readings without an invoice.
    const eligibleReadings = readings.filter(reading =>
        reading.reading_type === "MONTHLY" &&
        !invoicedIds.has(Number(reading.reading_id))
    );


    // ==================================================
    // AVAILABLE METERS
    // ==================================================

    const availableMeters = [
        ...new Set(
            eligibleReadings.map(reading => reading.meter_serial)
        )
    ];


    // ==================================================
    // READINGS FOR SELECTED METER
    // ==================================================

    const meterReadings = eligibleReadings.filter(
        reading => reading.meter_serial === meterSerial
    );


    // ==================================================
    // SELECTED MONTHLY READING
    // ==================================================

    const selectedReading = eligibleReadings.find(
        reading => String(reading.reading_id) === readingId
    );


    // ==================================================
    // PREVIEW PREVIOUS READING
    // ==================================================
    //
    // This mirrors the current backend's date-based
    // lookup for our initial controlled demonstration.
    //
    // The backend remains authoritative.
    // ==================================================

    const previousReading = selectedReading
        ? readings
            .filter(reading =>
                reading.meter_serial === selectedReading.meter_serial &&
                reading.reading_date < selectedReading.reading_date
            )
            .sort((a, b) =>
                b.reading_date.localeCompare(a.reading_date)
            )[0]
        : null;


    // ==================================================
    // PREVIEW CONSUMPTION AND TOTAL
    // ==================================================

    const rate = 0.50;

    const consumption =
        selectedReading && previousReading
            ? Number(selectedReading.reading_value) -
              Number(previousReading.reading_value)
            : null;

    const totalAmount =
        consumption !== null && consumption >= 0
            ? consumption * rate
            : null;


    // ==================================================
    // SAVE INVOICE
    // ==================================================

    async function handleSubmit(event) {

        event.preventDefault();

        if (saving || saved) return;

        setMessage("");
        setError("");

        if (!/^[0-9]{1,30}$/.test(invoiceNumber)) {

            setError("Invoice number must contain 1–30 digits.");
            return;
        }

        if (!selectedReading) {

            setError("Please select a MONTHLY reading.");
            return;
        }

        if (!invoiceDate) {

            setError("Invoice date is required.");
            return;
        }

        setSaving(true);

        try {

            const result = await createBill(token, {

                invoice_number: invoiceNumber,

                reading_id: Number(readingId),

                invoice_date: invoiceDate
            });

            setMessage(result.message);

            setSaved(true);

            // Refresh invoice history in parent.
            if (onSaved) {
                onSaved();
            }

            await loadData();

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);
        }
    }


    // ==================================================
    // PREPARE ANOTHER INVOICE
    // ==================================================

    function handleNewInvoice() {

        setInvoiceNumber("");
        setMeterSerial("");
        setReadingId("");
        setInvoiceDate("");

        setMessage("");
        setError("");

        setSaved(false);
    }


    // ==================================================
    // DISPLAY INVOICE REGISTRATION FORM
    // ==================================================

    return (

        <section className="card shadow-sm mb-4">

            <div className="card-body">

                <h3 className="card-title text-center mb-4">
                    🧾 Invoice Registration
                </h3>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {loading && (
                    <div className="alert alert-info">
                        Loading invoice information...
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="row g-4">

                        {/* LEFT COLUMN */}

                        <div className="col-md-6">

                            {/* INVOICE NUMBER */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="invoiceNumber"
                                    className="col-sm-4 col-form-label"
                                >
                                    Invoice No:
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        id="invoiceNumber"
                                        className="form-control"
                                        value={invoiceNumber}
                                        onChange={event =>
                                            setInvoiceNumber(event.target.value)
                                        }
                                        maxLength={30}
                                        required
                                        disabled={saving || saved}
                                    />

                                </div>

                            </div>


                            {/* METER NUMBER */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="billMeter"
                                    className="col-sm-4 col-form-label"
                                >
                                    Meter No:
                                </label>

                                <div className="col-sm-8">

                                    <select
                                        id="billMeter"
                                        className="form-select"
                                        value={meterSerial}
                                        onChange={event => {
                                            setMeterSerial(event.target.value);
                                            setReadingId("");
                                        }}
                                        disabled={saving || saved || loading}
                                        required
                                    >

                                        <option value="">
                                            Select Meter
                                        </option>

                                        {availableMeters.map(serial => (

                                            <option
                                                key={serial}
                                                value={serial}
                                            >
                                                {formatMeter(serial)}
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
                                            selectedReading
                                                ? `${selectedReading.first_name} ${selectedReading.last_name}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>


                            {/* PREVIOUS READING */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-4 col-form-label">
                                    Previous (m³):
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        className="form-control"
                                        value={previousReading?.reading_value ?? ""}
                                        readOnly
                                    />

                                </div>

                            </div>


                            {/* CONSUMPTION */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-4 col-form-label">
                                    Consumption:
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        className="form-control"
                                        value={
                                            consumption !== null && consumption >= 0
                                                ? `${consumption} m³`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                        </div>


                        {/* RIGHT COLUMN */}

                        <div className="col-md-6">

                            {/* INVOICE DATE */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="invoiceDate"
                                    className="col-sm-4 col-form-label"
                                >
                                    Invoice Date:
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        type="date"
                                        id="invoiceDate"
                                        className="form-control"
                                        value={invoiceDate}
                                        onChange={event =>
                                            setInvoiceDate(event.target.value)
                                        }
                                        disabled={saving || saved}
                                        required
                                    />

                                </div>

                            </div>


                            {/* BILLING MONTH */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="billMonth"
                                    className="col-sm-4 col-form-label"
                                >
                                    Billing Month:
                                </label>

                                <div className="col-sm-8">

                                    <select
                                        id="billMonth"
                                        className="form-select"
                                        value={readingId}
                                        onChange={event =>
                                            setReadingId(event.target.value)
                                        }
                                        disabled={
                                            saving || saved ||
                                            loading || !meterSerial
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Month
                                        </option>

                                        {meterReadings.map(reading => (

                                            <option
                                                key={reading.reading_id}
                                                value={reading.reading_id}
                                            >
                                                {formatMonth(reading.billing_month)}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>


                            {/* RATE */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-4 col-form-label">
                                    Rate per m³:
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        className="form-control"
                                        value="$0.50"
                                        readOnly
                                    />

                                </div>

                            </div>


                            {/* CURRENT READING */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-4 col-form-label">
                                    Current (m³):
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        className="form-control"
                                        value={selectedReading?.reading_value ?? ""}
                                        readOnly
                                    />

                                </div>

                            </div>


                            {/* TOTAL AMOUNT */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-4 col-form-label">
                                    Total Amount:
                                </label>

                                <div className="col-sm-8">

                                    <input
                                        className="form-control"
                                        value={
                                            totalAmount !== null
                                                ? `$${totalAmount.toFixed(2)}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* CENTERED SAVE BUTTONS */}

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
                            disabled={
                                saving || saved || loading ||
                                !selectedReading ||
                                !previousReading ||
                                consumption === null ||
                                consumption < 0
                            }
                        >
                            {saving
                                ? "⏳ Saving..."
                                : saved
                                    ? "✅ Invoice Saved"
                                    : "💾 Save Invoice"}
                        </button>

                        {saved && (

                            <button
                                type="button"
                                className="btn btn-primary ms-2"
                                onClick={handleNewInvoice}
                            >
                                ➕ New Invoice
                            </button>

                        )}

                    </div>

                </form>

            </div>

        </section>
    );
}

export default BillForm;