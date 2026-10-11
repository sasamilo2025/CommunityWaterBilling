CREATE TABLE IF NOT EXISTS bills (

    -- ==================================================
    -- INVOICE IDENTIFICATION
    -- ==================================================

    -- Invoice number printed in the physical invoice book.
    -- Entered manually by staff.
    -- VARCHAR preserves leading zeros.
    invoice_number VARCHAR(30) PRIMARY KEY,

    -- Connects this invoice to one meter reading.
    -- The backend will ensure it is a MONTHLY reading.
    reading_id INT NOT NULL,

    -- ==================================================
    -- WATER CONSUMPTION
    -- ==================================================

    -- Previous month's closing reading.
    -- For the first bill, use the INITIAL reading.
    previous_reading INT UNSIGNED NOT NULL,

    -- Current month's closing reading.
    current_reading INT UNSIGNED NOT NULL,

    -- Consumption is calculated automatically.
    -- Example: 60 - 25 = 35 cubic metres.
    consumption_m3 INT UNSIGNED
        GENERATED ALWAYS AS (
            current_reading - previous_reading
        ) STORED,

    -- ==================================================
    -- BILLING CALCULATION
    -- ==================================================

    -- Water rate charged per cubic metre.
    -- DECIMAL ensures accurate financial calculations.
    -- The rate is stored with each invoice so that
    -- historical invoices retain their original rates.
    rate_per_m3 DECIMAL(10,2) NOT NULL,

    -- Calculate the invoice amount automatically.
    -- Formula: Consumption x Rate per cubic metre.
    -- Example: (60 - 25) x 0.50 = 17.50
    total_amount DECIMAL(12,2)
        GENERATED ALWAYS AS (
            (current_reading - previous_reading) * rate_per_m3
        ) STORED,

    -- ==================================================
    -- INVOICE AND PAYMENT DATES
    -- ==================================================

    -- Date the invoice is issued and sent.
    invoice_date DATE NOT NULL,

    -- Payment deadline is 30 calendar days
    -- after the invoice date.
    payment_due_date DATE
        GENERATED ALWAYS AS (
            DATE_ADD(invoice_date, INTERVAL 30 DAY)
        ) STORED,

    -- ==================================================
    -- PAYMENT STATUS
    -- ==================================================

    -- UNPAID: No payments received.
    -- PARTIAL: Some payment received.
    -- PAID: Invoice paid in full.
    status VARCHAR(10) NOT NULL DEFAULT 'UNPAID',

    -- Automatically records when the invoice
    -- was entered into the database.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- ==================================================
    -- DATABASE VALIDATION RULES
    -- ==================================================

    -- Invoice numbers must contain digits only.
    -- Examples: 1, 25, 00125, 123456.
    CONSTRAINT chk_invoice_number
        CHECK (invoice_number REGEXP '^[0-9]+$'),

    -- Prevents two invoices being issued
    -- for the same monthly meter reading.
    CONSTRAINT uq_bill_reading
        UNIQUE (reading_id),

    -- Closing reading cannot be less than opening reading.
    CONSTRAINT chk_bill_readings
        CHECK (current_reading >= previous_reading),

    -- Water rates cannot be negative.
    CONSTRAINT chk_bill_rate
        CHECK (rate_per_m3 >= 0),

    -- Restricts payment status to valid values.
    CONSTRAINT chk_bill_status
        CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID')),

    -- ==================================================
    -- FOREIGN KEY RELATIONSHIP
    -- ==================================================

    -- Each invoice must reference an existing
    -- meter reading.
    --
    -- RESTRICT prevents deleting a reading
    -- if an invoice already references it.
    CONSTRAINT fk_bills_reading
        FOREIGN KEY (reading_id)
        REFERENCES meter_readings(reading_id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT

);