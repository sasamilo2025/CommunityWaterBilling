// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// CUSTOMER INVOICE HISTORY AND REPORT
// ==================================================
//
// PURPOSE:
// 1. Retrieve customer invoices from Express.
// 2. Display invoice history.
// 3. Allow ADMIN/MANAGER to view an invoice.
// 4. Display the payment due date as the LAST item.
//
// SECURITY:
// ADMIN and MANAGER may view invoices.
// Backend independently enforces permissions.
//
// ==================================================

import { useEffect, useState } from "react";

import { getBills } from "../services/billService";


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
// FORMAT MYSQL DATE
// ==================================================
//
// SQL DATE values arrive as YYYY-MM-DD strings.
// Avoid timezone conversions.
// ==================================================

function formatDate(value) {

    if (!value) return "—";

    const [year, month, day] =
        String(value).slice(0, 10).split("-");

    return `${day}/${month}/${year}`;
}


// ==================================================
// FORMAT BILLING MONTH
// ==================================================

function formatMonth(value) {

    if (!value) return "—";

    const [year, month] =
        String(value).slice(0, 7).split("-");

    const monthNames = [
        "January", "February", "March",
        "April", "May", "June",
        "July", "August", "September",
        "October", "November", "December"
    ];

    return `${monthNames[Number(month) - 1]} ${year}`;
}


// ==================================================
// FORMAT MONEY
// ==================================================

function formatMoney(value) {

    return `$${Number(value).toFixed(2)}`;
}


// ==================================================
// INVOICE HISTORY COMPONENT
// ==================================================

function BillList({ token }) {

    const [bills, setBills] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // Currently selected invoice for report display.
    const [selectedBill, setSelectedBill] = useState(null);


    // ==================================================
    // LOAD INVOICE HISTORY
    // ==================================================

    useEffect(() => {

        let cancelled = false;

        async function loadBills() {

            try {

                const data = await getBills(token);

                if (!cancelled) {
                    setBills(
                        Array.isArray(data.bills)
                            ? data.bills
                            : []
                    );
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

        loadBills();

        return () => {
            cancelled = true;
        };

    }, [token]);


    // ==================================================
    // DISPLAY INVOICE HISTORY AND REPORT
    // ==================================================

    return (

        <section className="card shadow-sm mb-4">

            <div className="card-body">

                <h3 className="card-title mb-3">
                    🧾 Customer Invoice History
                </h3>

                <p className="text-muted">
                    View registered customer invoices,
                    water consumption, charges and payment status.
                </p>

                {/* LOADING MESSAGE */}

                {loading && (
                    <div className="alert alert-info">
                        Loading invoices...
                    </div>
                )}

                {/* ERROR MESSAGE */}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {/* INVOICE HISTORY TABLE */}

                {!loading && !error && (

                    <div className="table-responsive">

                        <table className="table table-striped table-bordered table-hover align-middle">

                            <thead className="table-dark">

                                <tr>
                                    <th>Invoice No</th>
                                    <th>Customer</th>
                                    <th>Meter No</th>
                                    <th>Billing Month</th>
                                    <th>Consumption (m³)</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Invoice</th>
                                </tr>

                            </thead>

                            <tbody>

                                {bills.map(bill => (

                                    <tr key={bill.invoice_number}>

                                        <td>{bill.invoice_number}</td>

                                        <td>
                                            {bill.first_name}{" "}
                                            {bill.last_name}
                                        </td>

                                        <td>
                                            {formatMeter(bill.meter_serial)}
                                        </td>

                                        <td>
                                            {formatMonth(bill.billing_month)}
                                        </td>

                                        <td>
                                            {bill.consumption_m3}
                                        </td>

                                        <td>
                                            {formatMoney(bill.total_amount)}
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    bill.status === "PAID"
                                                        ? "badge bg-success"
                                                        : bill.status === "PARTIAL"
                                                            ? "badge bg-warning text-dark"
                                                            : "badge bg-danger"
                                                }
                                            >
                                                {bill.status}
                                            </span>

                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() =>
                                                    setSelectedBill(bill)
                                                }
                                            >
                                                View Invoice
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                                {bills.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="text-center text-muted"
                                        >
                                            No invoices registered yet.
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>
                )}


                {/* ==================================================
                    CUSTOMER INVOICE REPORT
                ================================================== */}

                {selectedBill && (

                    <div className="card border-primary mt-4">

                        <div className="card-body">

                            <h3 className="text-center mb-2">
                                💧 Community Water Billing System
                            </h3>

                            <h4 className="text-center mb-4">
                                CUSTOMER INVOICE
                            </h4>

                            <hr />

                            {/* Invoice identification */}

                            <div className="row mb-2">
                                <div className="col-6">
                                    Invoice Number:
                                </div>
                                <div className="col-6 fw-semibold">
                                    {selectedBill.invoice_number}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Customer Number:
                                </div>
                                <div className="col-6">
                                    {selectedBill.customer_no}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Customer Name:
                                </div>
                                <div className="col-6">
                                    {selectedBill.first_name}{" "}
                                    {selectedBill.last_name}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Meter Number:
                                </div>
                                <div className="col-6">
                                    {formatMeter(
                                        selectedBill.meter_serial
                                    )}
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Billing Month:
                                </div>
                                <div className="col-6">
                                    {formatMonth(
                                        selectedBill.billing_month
                                    )}
                                </div>
                            </div>

                            <hr />

                            {/* Consumption calculations */}

                            <div className="row mb-2">
                                <div className="col-6">
                                    Previous Reading:
                                </div>
                                <div className="col-6">
                                    {selectedBill.previous_reading} m³
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Current Reading:
                                </div>
                                <div className="col-6">
                                    {selectedBill.current_reading} m³
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Water Consumption:
                                </div>
                                <div className="col-6">
                                    {selectedBill.consumption_m3} m³
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-6">
                                    Rate per m³:
                                </div>
                                <div className="col-6">
                                    {formatMoney(
                                        selectedBill.rate_per_m3
                                    )}
                                </div>
                            </div>

                            <hr />

                            {/* Total invoice amount */}

                            <div className="row mb-3">

                                <div className="col-6 fw-bold">
                                    TOTAL AMOUNT:
                                </div>

                                <div className="col-6 fw-bold">
                                    {formatMoney(
                                        selectedBill.total_amount
                                    )}
                                </div>

                            </div>

                            {/* Invoice issue date */}

                            <div className="row mb-3">

                                <div className="col-6">
                                    Invoice Date:
                                </div>

                                <div className="col-6">
                                    {formatDate(
                                        selectedBill.invoice_date
                                    )}
                                </div>

                            </div>


                            {/* ======================================
                                FINAL INVOICE ITEM: PAYMENT DUE DATE
                            ====================================== */}

                            <div className="alert alert-warning">

                                <div className="row">

                                    <div className="col-6 fw-bold">
                                        PAYMENT DUE DATE:
                                    </div>

                                    <div className="col-6 fw-bold">
                                        {formatDate(
                                            selectedBill.payment_due_date
                                        )}
                                    </div>

                                </div>

                            </div>

                            {/* Close report control — not an invoice item. */}

                            <div className="text-center mt-3">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setSelectedBill(null)
                                    }
                                >
                                    Close Invoice
                                </button>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </section>
    );
}

export default BillList;