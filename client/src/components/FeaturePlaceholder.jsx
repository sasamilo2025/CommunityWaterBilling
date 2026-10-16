// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// FEATURE PLACEHOLDER COMPONENT
// ==================================================
//
// PURPOSE:
// Display a clear message for dashboard modules
// that have not yet been implemented.
//
// This component is shared by all three roles.
// ==================================================


// --------------------------------------------------
// FEATURE TITLES
// --------------------------------------------------
// Each menu identifier has a corresponding title.
// --------------------------------------------------

const featureTitles = {

    // ADMIN features
    meters: "🚰 Meter Management",
    readings: "📊 Meter Readings",
    bills: "🧾 Billing Management",
    payments: "💵 Payment Management",
    users: "👤 User Management",

    // MANAGER features
    rates: "💲 Water Rates",
    reports: "📊 Management Reports",
    "customers-view": "👥 Customer Records",
    "meters-view": "🚰 Meter Records",
    "billing-summary": "🧾 Billing Summary",
    "payment-summary": "💵 Payment Summary",

    // CUSTOMER features
    profile: "👤 My Profile",
    "my-meters": "🚰 My Meters",
    "my-readings": "📊 My Meter Readings",
    "my-bills": "🧾 My Bills",
    "my-payments": "💵 My Payments",

};


// --------------------------------------------------
// FEATURE PLACEHOLDER COMPONENT
// --------------------------------------------------

function FeaturePlaceholder({ activeMenu }) {

    // Find the title associated with the selected menu.
    const title =
        featureTitles[activeMenu] || "Dashboard Feature";

    return (

        <section
            style={{
                marginTop: "25px",
                padding: "30px",
                backgroundColor: "#16324f",
                borderRadius: "12px",
                color: "white",
                textAlign: "left",
            }}
        >

            <h2>{title}</h2>

            <hr
                style={{
                    borderColor: "#456b8a",
                    margin: "20px 0",
                }}
            />

            <h3>🚧 Module Under Development</h3>

            <p
                style={{
                    fontSize: "17px",
                    lineHeight: "1.7",
                }}
            >
                This feature is currently under development
                and is not yet available.
            </p>

            <p
                style={{
                    color: "#b8d8f0",
                }}
            >
                Please select another option from the
                navigation menu.
            </p>

        </section>
    );
}

export default FeaturePlaceholder;