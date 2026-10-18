// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER READINGS LIST
// ==================================================
//
// PURPOSE:
// 1. Retrieve meter readings from Express.
// 2. Display readings in a Bootstrap table.
// 3. Show the customer associated with each meter.
// 4. Display readings in cubic metres (m³).
//
// SECURITY:
// ADMIN and MANAGER may view this list.
// Express independently enforces permissions.
//
// ==================================================

import { useEffect, useState } from "react";

import { getReadings } from "../services/readingService";


// ==================================================
// FORMAT METER NUMBER
// ==================================================
//
// Example:
// 12345678 → 1234-5678
//
// The formatting is for display only.
// MySQL continues to store all eight digits.
// ==================================================

function formatMeterNumber(serial) {

    const value = String(serial || "");

    if (value.length !== 8) {
        return value;
    }

    return `${value.slice(0, 4)}-${value.slice(4)}`;
}


// ==================================================
// FORMAT SQL DATE
// ==================================================
//
// MySQL provides YYYY-MM-DD.
//
// Example:
// 2026-10-17 → 17/10/2026
//
// Avoid new Date() to prevent timezone issues.
// ==================================================

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const value = String(dateString).slice(0, 10);

    const [year, month, day] = value.split("-");

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}`;
}


// ==================================================
// READING LIST COMPONENT
// ==================================================

function ReadingList({ token }) {

    // Readings returned by Express.
    const [readings, setReadings] = useState([]);

    // Track the initial API request.
    const [loading, setLoading] = useState(true);

    // Display errors without crashing the dashboard.
    const [error, setError] = useState("");


    // ==================================================
    // LOAD METER READINGS
    // ==================================================

    useEffect(() => {

        let cancelled = false;

        async function loadReadings() {

            setLoading(true);
            setError("");

            try {

                // Retrieve readings using the JWT.
                const data = await getReadings(token);

                // Update state only while mounted.
                if (!cancelled) {

                    setReadings(
                        Array.isArray(data.readings)
                            ? data.readings
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

        loadReadings();

        // Prevent state updates after unmounting.
        return () => {
            cancelled = true;
        };

    }, [token]);


    // ==================================================
    // RENDER READINGS TABLE
    // ==================================================

    return (

        <section className="card shadow-sm mb-4">

            <div className="card-body">

                <h3 className="card-title mb-3">
                    📊 Meter Readings History
                </h3>

                <p className="text-muted">
                    View registered meter readings.
                    All measurements are in cubic metres (m³).
                </p>

                {/* Loading message. */}
                {loading && (
                    <div className="alert alert-info">
                        Loading meter readings...
                    </div>
                )}

                {/* API error message. */}
                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {/* Show table after successful loading. */}
                {!loading && !error && (

                    <div className="table-responsive">

                        <table className="table table-striped table-bordered table-hover align-middle">

                            <thead className="table-dark">

                                <tr>
                                    <th>Meter Number</th>
                                    <th>Customer Number</th>
                                    <th>Customer Name</th>
                                    <th>Billing Month</th>
                                    <th>Reading Type</th>
                                    <th>Reading Date</th>
                                    <th className="text-end">
                                        Reading (m³)
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {readings.map((reading) => (

                                    <tr key={reading.reading_id}>

                                        <td>
                                            {formatMeterNumber(
                                                reading.meter_serial
                                            )}
                                        </td>

                                        <td>
                                            {reading.customer_no}
                                        </td>

                                        <td>
                                            {reading.first_name}{" "}
                                            {reading.last_name}
                                        </td>

                                        <td>
                                            {formatDate(
                                                reading.billing_month
                                            )}
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    reading.reading_type === "INITIAL"
                                                        ? "badge bg-info text-dark"
                                                        : "badge bg-primary"
                                                }
                                            >
                                                {reading.reading_type}
                                            </span>

                                        </td>

                                        <td>
                                            {formatDate(
                                                reading.reading_date
                                            )}
                                        </td>

                                        <td className="text-end">
                                            {reading.reading_value}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                        {/* Empty database message. */}
                        {readings.length === 0 && (

                            <div className="alert alert-warning mt-3">
                                No meter readings have been registered.
                            </div>

                        )}

                        {/* Total record count. */}
                        <p className="text-muted mt-3 mb-0">
                            Total readings: <strong>{readings.length}</strong>
                        </p>

                    </div>

                )}

            </div>

        </section>

    );
}

export default ReadingList;