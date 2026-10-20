// ==========================================================
// COMMUNITY WATER BILLING SYSTEM
// PAYMENT REGISTRATION FORM
// ==========================================================
//
// ADMIN ONLY
//
// Supports:
// - Full payments
// - Partial payments
// - Multiple receipts per invoice
// - Automatic outstanding balance
// - Protection against accidental double submission
//
// ==========================================================

import { useEffect, useState } from "react";

import { getBills } from "../services/billService";
import { getPayments, createPayment } from "../services/paymentService";


// Convert currency amounts into integer cents.
function toCents(value) {
    return Math.round(Number(value || 0) * 100);
}


// Format currency consistently.
function money(value) {
    return Number(value || 0).toFixed(2);
}


// Today's date for the payment date input.
function today() {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Starting form values.
function initialForm() {
    return {
        receipt_number: "",
        invoice_number: "",
        payment_date: today(),
        amount_paid: ""
    };
}


export default function PaymentForm({
    token,
    onPaymentSaved
}) {

    const [form, setForm] = useState(initialForm);

    const [bills, setBills] = useState([]);

    const [payments, setPayments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [saved, setSaved] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");


    // ======================================================
    // LOAD INVOICES AND PAYMENT HISTORY
    // ======================================================

    async function loadData() {

        setLoading(true);

        try {

            const [billData, paymentData] = await Promise.all([
                getBills(token),
                getPayments(token)
            ]);

            setBills(billData.bills || []);

            setPayments(paymentData.payments || []);

            setError("");

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);
        }
    }


    useEffect(() => {

        loadData();

        // Reload when authenticated user changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);


    // ======================================================
    // SELECTED INVOICE
    // ======================================================

    const selectedBill = bills.find(
        (bill) =>
            String(bill.invoice_number) === form.invoice_number
    );


    // ======================================================
    // CALCULATE PAYMENT TOTALS
    // ======================================================

    const existingPayments = payments.filter(
        (payment) =>
            String(payment.invoice_number) === form.invoice_number
    );

    const totalPaidCents = existingPayments.reduce(
        (sum, payment) => sum + toCents(payment.amount_paid),
        0
    );

    const invoiceCents = selectedBill
        ? toCents(selectedBill.total_amount)
        : 0;

    const balanceCents = Math.max(
        0,
        invoiceCents - totalPaidCents
    );

    const paymentCents = toCents(form.amount_paid);

    // ======================================================
    // CALCULATE PROJECTED BALANCE AFTER PAYMENT
    // ======================================================
    //
    // This value is only a preview.
    //
    // It does not modify the database.
    // The backend will recalculate the true outstanding
    // balance when ADMIN saves the payment.

    // ======================================================
    // BALANCE AFTER PAYMENT
    // ======================================================
    //
    // BEFORE SAVING:
    // Show the projected remaining balance.
    //
    // AFTER SAVING:
    // The payment has already been included in totalPaid.
    // Therefore, show the actual outstanding balance
    // without subtracting the payment a second time.
    //
    // ======================================================

    const balanceAfterPaymentCents = saved
        ? balanceCents
        : balanceCents - paymentCents;


    // ======================================================
    // FORM VALIDATION
    // ======================================================

    // ======================================================
    // RECEIPT NUMBER VALIDATION
    // ======================================================

    // Receipt numbers must contain 1–30 digits.
    const receiptFormatValid =
        /^[0-9]{1,30}$/.test(form.receipt_number);

    // Check whether another payment already uses this
    // receipt number. This provides immediate feedback
    // before ADMIN attempts to save.
    const receiptAlreadyExists = payments.some(
        (payment) =>
            String(payment.receipt_number) ===
            form.receipt_number
    );

    // Both conditions must pass before saving.
    const receiptValid =
        receiptFormatValid && !receiptAlreadyExists;

    const paymentAmountValid =
        form.amount_paid !== "" &&
        Number(form.amount_paid) > 0 &&
        /^\d+(\.\d{1,2})?$/.test(form.amount_paid) &&
        paymentCents <= balanceCents;

    const dateValid =
        form.payment_date !== "" &&
        (
            !selectedBill ||
            form.payment_date >= String(selectedBill.invoice_date).slice(0, 10)
        );

    const formValid =
        receiptValid &&
        selectedBill &&
        balanceCents > 0 &&
        paymentAmountValid &&
        dateValid;


    // ======================================================
    // INPUT HANDLER
    // ======================================================

    function handleChange(event) {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
        setMessage("");
    }


    // ======================================================
    // REGISTER PAYMENT
    // ======================================================

    async function handleSubmit(event) {

        event.preventDefault();

        if (!formValid || saving || saved) {
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {

            const payload = {

                receipt_number: form.receipt_number,

                invoice_number: form.invoice_number,

                payment_date: form.payment_date,

                amount_paid: Number(form.amount_paid)
            };

            const result = await createPayment(
                token,
                payload
            );

            setSaved(true);

            setMessage(
                `${result.message}. ` +
                `Invoice status: ${result.payment.invoice_status}. ` +
                `Outstanding balance: $${result.payment.outstanding_balance}`
            );

            // Refresh invoice and payment information.
            await loadData();

            // Notify App.jsx so other lists can refresh.
            if (onPaymentSaved) {
                onPaymentSaved();
            }

        } catch (err) {

            setError(err.message);

        } finally {

            setSaving(false);
        }
    }


    // ======================================================
    // RESET FOR THE NEXT PAYMENT
    // ======================================================

    function handleNewPayment() {

        setForm(initialForm());

        setSaved(false);

        setMessage("");
        setError("");

        loadData();
    }


    // ======================================================
    // RENDER PAYMENT FORM
    // ======================================================

    return (

        <div className="card shadow-sm mb-4">

            <div className="card-header bg-primary text-white">

                <h5 className="mb-0">
                    💰 Payment Registration
                </h5>

            </div>

            <div className="card-body">

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
                        Loading payment information...
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="row g-3">

                        {/* LEFT COLUMN */}

                        <div className="col-md-6">

                            {/* RECEIPT NUMBER */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="receipt_number"
                                    className="col-sm-5 col-form-label"
                                >
                                    Receipt No:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        id="receipt_number"
                                        name="receipt_number"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={30}
                                        className="form-control"
                                        value={form.receipt_number}
                                        onChange={handleChange}
                                        disabled={saved || saving}
                                        required
                                    />
                                    {/* Warn immediately if the receipt number exists. */}
                                    {receiptAlreadyExists && (

                                        <div className="text-danger small mt-1">
                                            ⚠️ Receipt number {form.receipt_number}
                                            {" "}has already been issued.
                                        </div>

                                    )}

                                </div>

                            </div>

                            {/* INVOICE NUMBER */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="payment_invoice_number"
                                    className="col-sm-5 col-form-label"
                                >
                                    Invoice No:
                                </label>

                                <div className="col-sm-7">

                                    <select
                                        id="payment_invoice_number"
                                        name="invoice_number"
                                        className="form-select"
                                        value={form.invoice_number}
                                        onChange={handleChange}
                                        disabled={saved || saving || loading}
                                        required
                                    >

                                        <option value="">
                                            -- Select Invoice --
                                        </option>

                                        {bills
                                            .filter((bill) => {

                                                const paid = payments
                                                    .filter(
                                                        (payment) =>
                                                            String(payment.invoice_number) ===
                                                            String(bill.invoice_number)
                                                    )
                                                    .reduce(
                                                        (sum, payment) =>
                                                            sum + toCents(payment.amount_paid),
                                                        0
                                                    );

                                                return (
                                                    toCents(bill.total_amount) > paid
                                                );
                                            })
                                            .map((bill) => (

                                                <option
                                                    key={bill.invoice_number}
                                                    value={bill.invoice_number}
                                                >
                                                    {bill.invoice_number}
                                                    {" — "}
                                                    {bill.first_name} {bill.last_name}
                                                </option>

                                            ))}

                                    </select>

                                </div>

                            </div>

                            {/* CUSTOMER */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Customer:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        className="form-control"
                                        value={
                                            selectedBill
                                                ? `${selectedBill.first_name} ${selectedBill.last_name}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                            {/* INVOICE AMOUNT */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Invoice Amount:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        className="form-control"
                                        value={
                                            selectedBill
                                                ? `$${money(selectedBill.total_amount)}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                            {/* TOTAL PAID */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Total Paid:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        className="form-control"
                                        value={
                                            selectedBill
                                                ? `$${money(totalPaidCents / 100)}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                        </div>


                        {/* RIGHT COLUMN */}

                        <div className="col-md-6">

                            {/* PAYMENT DATE */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="payment_date"
                                    className="col-sm-5 col-form-label"
                                >
                                    Payment Date:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        id="payment_date"
                                        name="payment_date"
                                        type="date"
                                        className="form-control"
                                        value={form.payment_date}
                                        onChange={handleChange}
                                        disabled={saved || saving}
                                        required
                                    />

                                </div>

                            </div>

                            {/* PAYMENT METHOD */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Payment Method:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        className="form-control"
                                        value="CASH"
                                        readOnly
                                    />

                                </div>

                            </div>

                            {/* PAYMENT AMOUNT */}

                            <div className="row align-items-center mb-3">

                                <label
                                    htmlFor="amount_paid"
                                    className="col-sm-5 col-form-label"
                                >
                                    Payment Amount:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        id="amount_paid"
                                        name="amount_paid"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className="form-control"
                                        value={form.amount_paid}
                                        onChange={handleChange}
                                        disabled={saved || saving}
                                        required
                                    />

                                </div>

                            </div>

                            {/* BALANCE DUE */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Balance Due:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        className="form-control fw-bold"
                                        value={
                                            selectedBill
                                                ? `$${money(balanceCents / 100)}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                            {/* BALANCE AFTER THIS PAYMENT */}

                            <div className="row align-items-center mb-3">

                                <label className="col-sm-5 col-form-label">
                                    Balance After Payment:
                                </label>

                                <div className="col-sm-7">

                                    <input
                                        className="form-control fw-bold"
                                        value={
                                            selectedBill
                                                ? `$${money(
                                                    Math.max(0, balanceAfterPaymentCents) / 100
                                                )}`
                                                : ""
                                        }
                                        readOnly
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* SAVE BUTTON */}

                    <div className="text-center mt-4">

                        <button
                            type="submit"
                            className="btn btn-success px-5"
                            disabled={
                                !formValid ||
                                loading ||
                                saving ||
                                saved
                            }
                        >

                            {saving
                                ? "Saving..."
                                : saved
                                    ? "✅ Payment Saved"
                                    : "💾 Save Payment"
                            }

                        </button>

                    </div>


                    {/* NEW PAYMENT BUTTON */}

                    {saved && (

                        <div className="text-center mt-3">

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNewPayment}
                            >
                                ➕ New Payment
                            </button>

                        </div>

                    )}

                </form>

            </div>

        </div>
    );
}