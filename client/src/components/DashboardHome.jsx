// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// DASHBOARD HOME COMPONENT
// ==================================================
//
// PURPOSE:
// Display a welcome panel appropriate for the
// currently authenticated user's role.
//
// This component is shared by:
// 1. ADMIN
// 2. MANAGER
// 3. CUSTOMER
//
// Future development:
// Add live database statistics and summaries.
// ==================================================


// --------------------------------------------------
// DASHBOARD INFORMATION BY USER ROLE
// --------------------------------------------------

const dashboardInformation = {

    ADMIN: {
        title: "🛠️ Administration Dashboard",
        description:
            "Manage customers, water meters, monthly readings, invoices and payments.",
        message:
            "Select an option from the navigation menu to begin managing community water services.",
    },

    MANAGER: {
        title: "📊 Management Dashboard",
        description:
            "Monitor community water operations, financial performance and water tariffs.",
        message:
            "Use the navigation menu to access management reports and water rates.",
    },

    CUSTOMER: {
        title: "🏠 Customer Dashboard",
        description:
            "Welcome to your personal community water account.",
        message:
            "View your water meters, consumption history, invoices and payments using the navigation menu.",
    },

};


// --------------------------------------------------
// DASHBOARD HOME COMPONENT
// --------------------------------------------------

function DashboardHome({ user }) {

    // Retrieve dashboard information for this role.
    const information = dashboardInformation[user.role];

    // Prevent displaying an undefined dashboard.
    if (!information) {
        return (
            <p>Dashboard unavailable for this user role.</p>
        );
    }

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

            <h2>{information.title}</h2>

            <hr
                style={{
                    borderColor: "#456b8a",
                    margin: "20px 0",
                }}
            />

            <h3>
                👋 Welcome, {user.username}!
            </h3>

            <p
                style={{
                    fontSize: "17px",
                    lineHeight: "1.7",
                }}
            >
                {information.description}
            </p>

            <p
                style={{
                    color: "#b8d8f0",
                    fontSize: "15px",
                }}
            >
                {information.message}
            </p>

            <div
                style={{
                    marginTop: "25px",
                    padding: "15px",
                    backgroundColor: "#244766",
                    borderRadius: "8px",
                }}
            >
                🔐 Signed in as: <strong>{user.role}</strong>
            </div>

        </section>
    );
}

export default DashboardHome;