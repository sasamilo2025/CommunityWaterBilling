// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// METER LIST — READ-ONLY VERSION
// ==================================================
//
// PURPOSE:
// 1. Retrieve meter records from Express.
// 2. Display meters in a table.
// 3. Display meter serial numbers as 9999-9999.
// 4. Show loading and error messages.
//
// SECURITY:
// Every API request includes the authenticated JWT.
// Express independently enforces role permissions.
//
// ==================================================

import { useEffect, useState } from "react";

// Import our Meter API service.
import { getMeters } from "../services/meterService";


// ==================================================
// FORMAT METER SERIAL NUMBER
// ==================================================
//
// MySQL stores: 12345678
// React shows:  1234-5678
//
// Keep the serial number as a string to preserve
// leading zeros, such as 0012-3456.
// ==================================================

function formatMeterSerial(serial) {

    const value = String(serial);

    if (!/^[0-9]{8}$/.test(value)) {
        return value;
    }

    return `${value.slice(0, 4)}-${value.slice(4)}`;
}


// ==================================================
// METER LIST COMPONENT
// ==================================================

function MeterList({ token }) {

    // Store meter records retrieved from MySQL.
    const [meters, setMeters] = useState([]);

    // Track loading and errors.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ==================================================
    // LOAD METERS FROM EXPRESS
    // ==================================================

    useEffect(() => {

        // Prevent updates after component unmounts.
        let cancelled = false;

        async function loadMeters() {

            setLoading(true);
            setError("");

            try {

                // Send the JWT to our protected Meter API.
                const data = await getMeters(token);

                if (!cancelled) {
                    setMeters(data.meters);
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

        loadMeters();

        return () => {
            cancelled = true;
        };

    }, [token]);


    // ==================================================
    // DISPLAY METER RECORDS
    // ==================================================

    return (

        <section className="mt-4">

            <h3>💧 Registered Water Meters</h3>

            <p>
                View registered meters and their
                assigned customers.
            </p>

            {/* Display loading status. */}
            {loading && (
                <p>Loading meter records...</p>
            )}

            {/* Display API errors. */}
            {error && (
                <p className="text-danger">
                    {error}
                </p>
            )}

            {/* Display meter table after loading. */}
            {!loading && !error && (

                <div className="table-responsive">

                    <table className="table table-bordered table-striped">

                        <thead className="table-dark">
                            <tr>
                                <th>Meter Serial</th>
                                <th>Customer No.</th>
                                <th>Customer Name</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Installed</th>
                            </tr>
                        </thead>

                        <tbody>

                            {meters.map((meter) => (

                                <tr key={meter.meter_serial}>

                                    <td>
                                        {formatMeterSerial(
                                            meter.meter_serial
                                        )}
                                    </td>

                                    <td>
                                        {meter.customer_no}
                                    </td>

                                    <td>
                                        {meter.first_name}{" "}
                                        {meter.last_name}
                                    </td>

                                    <td>
                                        {meter.location}
                                    </td>

                                    <td>
                                        {meter.status}
                                    </td>

                                    <td>
                                        {meter.installed_at
                                            ? String(meter.installed_at).slice(0, 10)
                                            : "Not specified"}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                    {/* Show a message if no meters exist. */}
                    {meters.length === 0 && (
                        <p>No meters registered yet.</p>
                    )}

                </div>

            )}

        </section>
    );
}


// Export the component for use in App.jsx.
export default MeterList;