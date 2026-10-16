// ==================================================
// COMMUNITY WATER BILLING SYSTEM
// ROLE-BASED DASHBOARD SIDEBAR
// ==================================================
//
// PURPOSE:
// Display navigation menus based on the user's role.
//
// ADMIN    - Operational management.
// MANAGER  - Water rates and management reports.
// CUSTOMER - Personal account information.
//
// SECURITY:
// Menu visibility improves the user interface.
// Express must independently enforce permissions.
// ==================================================


// --------------------------------------------------
// NAVIGATION CONFIGURATION
// --------------------------------------------------
// Each role has its own list of permitted menu items.
//
// The "id" identifies the selected menu.
// The "label" is displayed to the user.
// --------------------------------------------------

const dashboardMenus = {

    ADMIN: [
        { id: "dashboard", label: "🏠 Dashboard" },
        { id: "customers", label: "👥 Customers" },
        { id: "meters", label: "🚰 Meters" },
        { id: "readings", label: "📊 Meter Readings" },
        { id: "bills", label: "🧾 Bills" },
        { id: "payments", label: "💵 Payments" },
        { id: "users", label: "👤 User Management" },
    ],

    MANAGER: [
        { id: "dashboard", label: "🏠 Dashboard" },
        { id: "rates", label: "💲 Water Rates" },
        { id: "reports", label: "📊 Reports" },
        { id: "customers-view", label: "👥 Customers (View)" },
        { id: "meters-view", label: "🚰 Meters (View)" },
        { id: "billing-summary", label: "🧾 Billing Summary" },
        { id: "payment-summary", label: "💵 Payment Summary" },
    ],

    CUSTOMER: [
        { id: "dashboard", label: "🏠 Dashboard" },
        { id: "profile", label: "👤 My Profile" },
        { id: "my-meters", label: "🚰 My Meters" },
        { id: "my-readings", label: "📊 My Readings" },
        { id: "my-bills", label: "🧾 My Bills" },
        { id: "my-payments", label: "💵 My Payments" },
    ],

};


// --------------------------------------------------
// DASHBOARD SIDEBAR COMPONENT
// --------------------------------------------------
//
// PROPS:
//
// role:
//   The authenticated user's role.
//
// activeMenu:
//   The currently selected navigation menu.
//
// onMenuChange:
//   Function supplied by App.jsx.
//   Updates the selected menu.
// --------------------------------------------------

function DashboardSidebar({ role, activeMenu, onMenuChange }) {

    // Retrieve the navigation menu for this role.
    // An unknown role receives an empty menu.
    const menus = dashboardMenus[role] || [];

    return (

        <nav
            aria-label="Dashboard navigation"
            style={{
                backgroundColor: "#16324f",
                padding: "20px",
                borderRadius: "10px",
                minWidth: "220px",
            }}
        >

            <h3
                style={{
                    color: "white",
                    fontSize: "18px",
                    marginBottom: "20px",
                }}
            >
                💧 Navigation
            </h3>

            {/* Display one button for each menu item. */}

            {menus.map((menu) => (

                <button
                    key={menu.id}
                    type="button"

                    // Highlight the currently selected menu.
                    onClick={() => onMenuChange(menu.id)}

                    aria-current={
                        activeMenu === menu.id ? "page" : undefined
                    }

                    style={{
                        display: "block",
                        width: "100%",
                        padding: "12px",
                        marginBottom: "8px",
                        textAlign: "left",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",

                        backgroundColor:
                            activeMenu === menu.id
                                ? "#0d6efd"
                                : "#244766",

                        color: "white",
                        fontWeight:
                            activeMenu === menu.id
                                ? "bold"
                                : "normal",
                    }}
                >
                    {menu.label}
                </button>

            ))}

        </nav>
    );
}

export default DashboardSidebar;