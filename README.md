# Community Water Billing System

### From Manual Records to Digital Solutions

*Inspired by my community. Developed through learning. Dedicated to giving back.*

## 1. Project Overview

The **Community Water Billing System** is a full-stack web application developed to support the administration of a community water supply service.

The project was inspired by practical experience volunteering in a community office in Samoa, where customer records, water meter installations, monthly readings, invoicing, payments and management reports were traditionally maintained manually, with assistance from Microsoft Excel.

The application demonstrates how modern web technologies can improve the organization, accuracy, accessibility and management of community water billing information.

This project was developed as a full-stack software development capstone.

## 2. Project Objectives

The main objectives are to:

* Digitize community customer and water meter records.
* Maintain monthly water meter readings.
* Generate customer water invoices.
* Record payments and monitor outstanding balances.
* Provide management reports.
* Apply data validation to improve accuracy.
* Protect application functionality through authentication and role-based authorization.
* Establish a foundation for future online community services.

## 3. Technology Stack

| Layer             | Technology        | Purpose                                    |
| ----------------- | ----------------- | ------------------------------------------ |
| Frontend          | React             | User interface                             |
| Development/build | Vite              | Frontend development and production builds |
| Styling           | Bootstrap and CSS | Responsive layout and interface styling    |
| Backend           | Node.js           | JavaScript server runtime                  |
| Web framework     | Express           | REST API                                   |
| Database          | MySQL             | Relational data storage                    |
| Database driver   | mysql2            | Backend database connections               |
| Authentication    | JSON Web Tokens   | Authenticated API access                   |
| Password security | Argon2            | Secure password hashing                    |
| Configuration     | dotenv            | Environment variables                      |
| Source control    | Git and GitHub    | Version control and project hosting        |
| Code analysis     | Oxlint            | Frontend static analysis                   |

## 4. System Architecture

The application follows a three-layer architecture.

```text
          USER / WEB BROWSER
                  |
                  v
       REACT FRONTEND (VITE)
        http://localhost:5173
                  |
             HTTP / JSON
                  |
                  v
       NODE.JS / EXPRESS API
        http://localhost:3000
                  |
             mysql2
                  |
                  v
           MYSQL DATABASE
       community_water_billing
```

The React frontend provides the user interface.

The Express backend processes API requests, validates operations, applies authentication and authorization rules, and communicates with MySQL.

MySQL stores customer, meter, reading, billing, payment and user-account information.

## 5. Main Application Features

### Customer Management

Supports management of customer information, including customer numbers, names and contact details.

### Water Meter Management

Supports registration and management of water meters associated with customers.

A customer may have multiple meters.

### Meter Readings

Maintains meter reading records, including the actual date a reading was taken and the corresponding billing month.

Initial readings establish opening meter values and are distinguished from monthly billable readings.

### Billing and Invoicing

Supports water consumption calculations and customer invoicing using recorded meter readings and applicable water rates.

### Payment Management

Supports recording payments against customer invoices, including partial payments.

### Management Reporting

Provides reporting functionality to help review billing, payments, consumption and other operational information.

### Authentication and Authorization

Controls access to application functions according to the authenticated user's role.

## 6. User Roles

The application is designed around three user roles.

| Role     | Main Responsibilities                                                     |
| -------- | ------------------------------------------------------------------------- |
| ADMIN    | Manage customers, meters, meter readings, invoices and payments           |
| MANAGER  | Maintain water rates and access management information                    |
| CUSTOMER | View permitted personal account, billing, reading and payment information |

Authorization is enforced by the backend.

Customer-specific access must also be restricted to the authenticated customer's own records.

## 7. Database Design

The system uses a MySQL relational database named:

`community_water_billing`

Core database tables include:

| Table            | Purpose                      |
| ---------------- | ---------------------------- |
| `customers`      | Customer information         |
| `meters`         | Water meter registration     |
| `meter_readings` | Monthly and initial readings |
| `bills`          | Customer invoices            |
| `payments`       | Payments against invoices    |
| `users`          | User accounts and roles      |

The database design uses primary keys, foreign keys and validation constraints to support data integrity.

Database scripts are maintained in the `database/` directory.

## 8. Project Structure

```text
CommunityWaterBilling/
|
|-- client/
|   |-- src/
|   |-- package.json
|   |-- vite.config.js
|
|-- se
```
