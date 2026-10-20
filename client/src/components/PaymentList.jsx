// ==========================================================
// COMMUNITY WATER BILLING SYSTEM
// PAYMENT HISTORY AND CUSTOMER RECEIPT
// ==========================================================
//
// ADMIN and MANAGER can:
// - View registered payments.
// - View individual payment receipts.
//
// Financial information comes from the Payments API.
//
// ==========================================================

import { useEffect, useState } from "react";

import { getPayments } from "../services/paymentService";

// Format currency to two decimal places.
function money(value) {
    return Number(value || 0).toFixed(2);
}

// Display MySQL dates as DD/MM/YYYY.
function formatDate(value) {

    if (!value) return "";

    const date = String(value).slice(0, 10);

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
}

export default function PaymentList({
    token,
    refreshKey = 0
}) {

    const [payments, setPayments] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [selectedPayment, setSelectedPayment] = useState(null);


    // ======================================================
    // RETRIEVE PAYMENT HISTORY
    // ======================================================

    useEffect(() => {

        let active = true;

        async function loadPayments() {

            setLoading(true);
            setError("");

            try {

                const result = await getPayments(token);

                if (active) {
                    setPayments(result.payments || []);
                }

            } catch (err) {

                if (active) {
                    setError(err.message);
                }

            } finally {

                if (active) {
                    setLoading(false);
                }
            }
        }

        loadPayments();

        return () => {
            active = false;
        };

    }, [token, refreshKey]);


    // ======================================================
    // DISPLAY PAYMENT HISTORY
    // ======================================================

    return (

        <div className="card shadow-sm mb-4">

            <div className="card-header bg-primary text-white">

                <h5 className="mb-0">
                    📋 Customer Payment History
                </h5>

            </div>

            <div className="card-body">

                {error && (

                    <div className="alert alert-danger">
                        {error}
                    </div>

                )}

                {loading ? (

                    <p>Loading payment history...</p>

                ) : payments.length === 0 ? (

                    <p>No payment records found.</p>

                ) : (

                    <div className="table-responsive">

                        <table className="table table-striped table-bordered align-middle">

                            <thead className="table-dark">

                                <tr>
                                    <th>Receipt No.</th>
                                    <th>Invoice No.</th>
                                    <th>Customer</th>
                                    <th>Payment Date</th>
                                    <th className="text-end">Amount Paid</th>
                                    <th>Action</th>
                                </tr>

                            </thead>

                            <tbody>

                                {payments.map((payment) => (

                                    <tr key={payment.receipt_number}>

                                        <td>
                                            {payment.receipt_number}
                                        </td>

                                        <td>
                                            {payment.invoice_number}
                                        </td>

                                        <td>
                                            {payment.first_name} {payment.last_name}
                                        </td>

                                        <td>
                                            {formatDate(payment.payment_date)}
                                        </td>

                                        <td className="text-end">
                                            ${money(payment.amount_paid)}
                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() =>
                                                    setSelectedPayment(payment)
                                                }
                                            >
                                                View Receipt
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

                {/* ======================================
                    INDIVIDUAL PAYMENT RECEIPT
                   ====================================== */}

                {selectedPayment && (

                    <div className="border rounded p-4 mt-4 bg-light">

                        <h5 className="text-center mb-4">
                            💧 Community Water Billing
                            <br />
                            Payment Receipt
                        </h5>

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Receipt No:</strong>
                            </div>

                            <div className="col-sm-6">
                                {selectedPayment.receipt_number}
                            </div>

                        </div>

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Invoice No:</strong>
                            </div>

                            <div className="col-sm-6">
                                {selectedPayment.invoice_number}
                            </div>

                        </div>

                        {/* ======================================
                            ORIGINAL INVOICE AMOUNT
                            ====================================== */}
                        {/* Display the original invoice total.
                            This amount remains unchanged even when
                            the customer makes partial payments. */}

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Invoice Amount:</strong>
                            </div>

                            <div className="col-sm-6">
                                {selectedPayment.total_amount == null
                                    ? "Unavailable"
                                    : `$${money(selectedPayment.total_amount)}`}
                            </div>

                        </div>

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Customer:</strong>
                            </div>

                            <div className="col-sm-6">
                                {selectedPayment.first_name}{" "}
                                {selectedPayment.last_name}
                            </div>

                        </div>

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Meter No:</strong>
                            </div>

                            <div className="col-sm-6">
                                {selectedPayment.meter_serial}
                            </div>

                        </div>

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Payment Date:</strong>
                            </div>

                            <div className="col-sm-6">
                                {formatDate(selectedPayment.payment_date)}
                            </div>

                        </div>

                        <div className="row mb-2">

                            <div className="col-sm-6">
                                <strong>Payment Method:</strong>
                            </div>

                            <div className="col-sm-6">
                                CASH
                            </div>

                        </div>

                        <hr />

                        <div className="row mb-3">

                            <div className="col-sm-6">
                                <strong>Amount Received:</strong>
                            </div>

                            <div className="col-sm-6 fw-bold text-success">
                                ${money(selectedPayment.amount_paid)}
                            </div>

                        </div>

                        {/* ======================================
                            OUTSTANDING BALANCE AFTER PAYMENT
                            ====================================== */}

                        <div className="row mb-3">

                            <div className="col-sm-6">
                                <strong>Balance After Payment:</strong>
                            </div>

                            <div className="col-sm-6 fw-bold text-primary">
                                {selectedPayment.balance_after_payment == null
                                    ? "Unavailable"
                                    : `$${money(selectedPayment.balance_after_payment)}`}
                            </div>

                        </div>

                        <div className="text-center">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setSelectedPayment(null)}
                            >
                                Close Receipt
                            </button>

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
}