// ==========================================================
// COMMUNITY WATER BILLING SYSTEM
// MANAGEMENT REPORTS
// ==========================================================
//
// REPORT 1:
// Monthly consumption and charges by customer.
//
// REPORT 2:
// Three-month grouped bar chart.
//
// All values come from the MySQL reporting API.
// ==========================================================

import { Fragment, useEffect, useState } from "react";

import {
    getMonthlyCustomerReport
} from "../services/reportService";

const MONTHS = [
    { key: "2026-07", label: "July" },
    { key: "2026-08", label: "August" },
    { key: "2026-09", label: "September" }
];

function money(value) {
    return Number(value || 0).toFixed(2);
}

function buildCustomerRows(report) {

    const customers = new Map();

    for (const item of report) {

        const key = item.customer_no;

        if (!customers.has(key)) {

            customers.set(key, {

                customer_no: item.customer_no,

                customer_name:
                    `${item.first_name} ${item.last_name}`,

                months: {},

                total_m3: 0,

                total_cost: 0
            });
        }

        const customer = customers.get(key);

        const consumption = Number(item.consumption_m3);

        const cost = Number(item.total_cost);

        customer.months[item.report_month] = {
            consumption,
            cost
        };

        customer.total_m3 += consumption;

        customer.total_cost += cost;
    }

    return Array.from(customers.values()).sort(
        (a, b) =>
            a.customer_no.localeCompare(b.customer_no)
    );
}


// ==========================================================
// MONTHLY CONSUMPTION BAR
// ==========================================================

function ConsumptionBar({
    value,
    maxValue,
    color
}) {

    const width = maxValue > 0
        ? (value / maxValue) * 100
        : 0;

    return (

        <div
            className="d-flex align-items-center gap-2"
            style={{ minWidth: "180px" }}
        >

            <div
                className="progress flex-grow-1"
                style={{ height: "18px" }}
            >

                <div
                    className={`progress-bar ${color}`}
                    style={{ width: `${width}%` }}
                />

            </div>

            <span
                className="small fw-bold"
                style={{ minWidth: "40px" }}
            >
                {value}
            </span>

        </div>
    );
}


// ==========================================================
// MAIN REPORT COMPONENT
// ==========================================================

export default function ManagementReports({ token }) {

    const [report, setReport] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [graphMetric, setGraphMetric] =
        useState("consumption");


    // ======================================================
    // LOAD REPORTS FROM MYSQL API
    // ======================================================

    useEffect(() => {

        let active = true;

        async function loadReport() {

            setLoading(true);

            try {

                const result =
                    await getMonthlyCustomerReport(token);

                if (active) {

                    setReport(result.report || []);

                    setError("");
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

        loadReport();

        return () => {
            active = false;
        };

    }, [token]);


    // ======================================================
    // PREPARE CUSTOMER AND MONTHLY TOTALS
    // ======================================================

    const customers = buildCustomerRows(report);

    const monthlyTotals = MONTHS.map((month) => {

        const items = report.filter(
            (item) => item.report_month === month.key
        );

        return {

            ...month,

            consumption: items.reduce(
                (sum, item) =>
                    sum + Number(item.consumption_m3),
                0
            ),

            cost: items.reduce(
                (sum, item) =>
                    sum + Number(item.total_cost),
                0
            )
        };
    });

    const totalConsumption = monthlyTotals.reduce(
        (sum, month) => sum + month.consumption,
        0
    );

    const totalCost = monthlyTotals.reduce(
        (sum, month) => sum + month.cost,
        0
    );

    const maxGraphValue = Math.max(
        1,
        ...customers.flatMap(
            (customer) =>
                MONTHS.map((month) => {

                    const data =
                        customer.months[month.key];

                    return graphMetric === "consumption"
                        ? data?.consumption || 0
                        : data?.cost || 0;
                })
        )
    );


    // ======================================================
    // RENDER REPORTS
    // ======================================================

    return (

        <div>

            <h3 className="mb-4">
                📊 Management Reports
            </h3>

            {error && (

                <div className="alert alert-danger">
                    {error}
                </div>

            )}

            {loading && (

                <div className="alert alert-info">
                    Loading management reports...
                </div>

            )}

            {!loading && !error && (

                <>

                    {/* ======================================
                        REPORT 1
                        MONTHLY CUSTOMER CONSUMPTION
                       ====================================== */}

                    <div className="card shadow-sm mb-4">

                        <div className="card-header bg-primary text-white">

                            <h5 className="mb-0">
                                📋 Monthly Customer Consumption and Costs
                            </h5>

                        </div>

                        <div className="card-body">

                            <p className="text-muted">
                                Reporting period:
                                July – September 2026
                            </p>

                            <div className="table-responsive">

                                <table
                                    className="table table-bordered table-striped align-middle"
                                >

                                    <thead className="table-dark">

                                        <tr>

                                            <th rowSpan="2">
                                                Customer
                                            </th>

                                            {MONTHS.map((month) => (

                                                <th
                                                    key={month.key}
                                                    colSpan="2"
                                                    className="text-center"
                                                >
                                                    {month.label}
                                                </th>

                                            ))}

                                            <th
                                                colSpan="2"
                                                className="text-center"
                                            >
                                                Three-Month Total
                                            </th>

                                        </tr>

                                        <tr>

                                            {MONTHS.map((month) => (

                                                <Fragment key={month.key}>
                                                    <th className="text-end">m³</th>
                                                    <th className="text-end">Cost ($)</th>
                                                </Fragment>

                                            ))}
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {customers.map((customer) => (

                                            <tr key={customer.customer_no}>

                                                <td>

                                                    <strong>
                                                        {customer.customer_no}
                                                    </strong>

                                                    <br />

                                                    {customer.customer_name}

                                                </td>

                                                {MONTHS.map((month) => {

                                                    const values =
                                                        customer.months[month.key] || {
                                                            consumption: 0,
                                                            cost: 0
                                                        };

                                                    return (

                                                        <MonthCells
                                                            key={month.key}
                                                            consumption={
                                                                values.consumption
                                                            }
                                                            cost={values.cost}
                                                        />

                                                    );
                                                })}

                                                <td className="fw-bold text-end">
                                                    {customer.total_m3}
                                                </td>

                                                <td className="fw-bold text-end">
                                                    ${money(customer.total_cost)}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                    <tfoot className="table-secondary fw-bold">

                                        <tr>

                                            <td>
                                                GRAND TOTAL
                                            </td>

                                            {monthlyTotals.map((month) => (

                                                <MonthCells
                                                    key={month.key}
                                                    consumption={
                                                        month.consumption
                                                    }
                                                    cost={month.cost}
                                                />

                                            ))}

                                            <td className="text-end">
                                                {totalConsumption}
                                            </td>

                                            <td className="text-end">
                                                ${money(totalCost)}
                                            </td>

                                        </tr>

                                    </tfoot>

                                </table>

                            </div>

                        </div>

                    </div>


                    {/* ======================================
                        REPORT 2
                        THREE-MONTH CUSTOMER GRAPH
                       ====================================== */}

                    <div className="card shadow-sm mb-4">

                        <div className="card-header bg-primary text-white">

                            <h5 className="mb-0">
                                📊 Three-Month Customer Comparison
                            </h5>

                        </div>

                        <div className="card-body">

                            <div className="mb-4">

                                <label
                                    htmlFor="graphMetric"
                                    className="form-label fw-bold"
                                >
                                    Graph Metric:
                                </label>

                                <select
                                    id="graphMetric"
                                    className="form-select"
                                    style={{ maxWidth: "260px" }}
                                    value={graphMetric}
                                    onChange={(event) =>
                                        setGraphMetric(
                                            event.target.value
                                        )
                                    }
                                >

                                    <option value="consumption">
                                        Consumption (m³)
                                    </option>

                                    <option value="cost">
                                        Charges ($)
                                    </option>

                                </select>

                            </div>

                            <div className="d-flex gap-3 mb-3 flex-wrap">

                                <span>🟦 July</span>
                                <span>🟩 August</span>
                                <span>🟨 September</span>

                            </div>

                            {/* ==============================================
                                VERTICAL GROUPED BAR CHART
                                ============================================== */}

                            <div className="table-responsive">

                                <div
                                    className="d-flex align-items-end gap-3 border-bottom pb-2"
                                    style={{
                                        minWidth: "720px",
                                        height: "320px"
                                    }}
                                >

                                    {customers.map((customer) => (

                                        <div
                                            key={customer.customer_no}
                                            className="d-flex flex-column align-items-center"
                                            style={{
                                                flex: "1 0 100px",
                                                minWidth: "100px"
                                            }}
                                        >

                                            {/* Three vertical bars for each customer */}

                                            <div
                                                className="d-flex justify-content-center align-items-end gap-1 w-100"
                                                style={{ height: "265px" }}
                                            >

                                                {MONTHS.map((month, index) => {

                                                    const values =
                                                        customer.months[month.key] || {
                                                            consumption: 0,
                                                            cost: 0
                                                        };

                                                    const value =
                                                        graphMetric === "consumption"
                                                            ? values.consumption
                                                            : values.cost;

                                                    const barHeight =
                                                        maxGraphValue > 0
                                                            ? (value / maxGraphValue) * 215
                                                            : 0;

                                                    const colors = [
                                                        "bg-primary",
                                                        "bg-success",
                                                        "bg-warning"
                                                    ];

                                                    return (

                                                        <div
                                                            key={month.key}
                                                            className="d-flex flex-column align-items-center justify-content-end"
                                                            style={{
                                                                width: "30px",
                                                                height: "100%"
                                                            }}
                                                            title={`${customer.customer_name} — ${month.label}: ${
                                                                graphMetric === "consumption"
                                                                    ? `${value} m³`
                                                                    : `$${money(value)}`
                                                            }`}
                                                        >

                                                            {/* Value above the column */}

                                                            <small
                                                                className="fw-bold"
                                                                style={{ fontSize: "10px" }}
                                                            >
                                                                {graphMetric === "consumption"
                                                                    ? value
                                                                    : money(value)}
                                                            </small>

                                                            {/* Vertical column */}

                                                            <div
                                                                className={`${colors[index]} rounded-top`}
                                                                style={{
                                                                    width: "25px",
                                                                    height: `${barHeight}px`,
                                                                    minHeight: value > 0 ? "2px" : "0"
                                                                }}
                                                            />

                                                        </div>

                                                    );
                                                })}

                                            </div>

                                            {/* Customer label below the columns */}

                                            <div
                                                className="text-center mt-2"
                                                style={{
                                                    fontSize: "12px",
                                                    minHeight: "42px"
                                                }}
                                            >

                                                <strong>
                                                    {customer.customer_no}
                                                </strong>

                                                <br />

                                                {customer.customer_name}

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        </div>

                    </div>

                </>

            )}

        </div>
    );
}


// ==========================================================
// HELPER COMPONENTS
// ==========================================================

// Render two cells for each month.
function MonthCells({ consumption, cost }) {

    return (

        <>
            <td className="text-end">
                {consumption}
            </td>

            <td className="text-end">
                ${money(cost)}
            </td>
        </>
    );
}


// Temporary header helper.
function ReactFragment() {

    return (

        <>
            <th className="text-end">
                m³
            </th>

            <th className="text-end">
                Cost ($)
            </th>
        </>

    );
}