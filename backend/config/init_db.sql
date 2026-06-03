-- Make Models Table (Template classification)
CREATE TABLE IF NOT EXISTS make_models (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Vehicle Models Table (Template specifications and default costs)
CREATE TABLE IF NOT EXISTS vehicle_models (
    id VARCHAR(50) PRIMARY KEY,
    make_model_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    engine_capacity VARCHAR(50),
    color VARCHAR(50),
    grade VARCHAR(50),
    year INT NOT NULL,
    mileage INT DEFAULT 0,
    cif_value DECIMAL(15, 2) NOT NULL,
    lc_amount DECIMAL(15, 2) NOT NULL,
    tt_amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL,
    service_charge DECIMAL(15, 2) NOT NULL,
    clearing_charge DECIMAL(15, 2) NOT NULL,
    dmi_charge DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (make_model_id) REFERENCES make_models(id) ON DELETE CASCADE
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    nic VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles Table (Core operational tracking for ordered/imported vehicles)
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    make_model_id VARCHAR(50) NULL,
    vehicle_model_id VARCHAR(50) NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    manufacture_year INT NOT NULL,
    grade VARCHAR(50),
    engine_capacity VARCHAR(50),
    mileage INT,
    color VARCHAR(50),
    chassis_number VARCHAR(100) UNIQUE,
    status ENUM('Inquiry', 'Ordered', 'Shipped', 'Clearing', 'Registered', 'Delivered') DEFAULT 'Inquiry',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (make_model_id) REFERENCES make_models(id) ON DELETE SET NULL,
    FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id) ON DELETE SET NULL
);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id INT NOT NULL,
    cif_value DECIMAL(15, 2) NOT NULL,
    lc_amount DECIMAL(15, 2) NOT NULL,
    tt_amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL,
    clearing_amount DECIMAL(15, 2) NOT NULL,
    service_charge DECIMAL(15, 2) NOT NULL,
    total_estimated DECIMAL(15, 2) GENERATED ALWAYS AS (cif_value + tax_amount + clearing_amount + service_charge) STORED,
    status ENUM('Draft', 'Sent', 'Accepted', 'Rejected') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Agreements Table
CREATE TABLE IF NOT EXISTS agreements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id VARCHAR(50) NOT NULL,
    signed_date DATE,
    signature_file_path TEXT,
    is_signed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id INT NOT NULL,
    quotation_id VARCHAR(50) NULL,
    invoice_type ENUM('Advance', 'Final') NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    tt_amount DECIMAL(15, 2) DEFAULT 0.00,
    advance_amount DECIMAL(15, 2) DEFAULT 0.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    is_lc_complete TINYINT(1) DEFAULT 0,
    is_tt_complete TINYINT(1) DEFAULT 0,
    due_date DATE NOT NULL,
    status ENUM('Pending', 'Partial', 'Paid') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    amount_paid DECIMAL(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('Cash', 'Bank Transfer', 'Cheque') NOT NULL,
    reference_number VARCHAR(100),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Milestone Reminders Table
CREATE TABLE IF NOT EXISTS milestone_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    milestone_type ENUM('TT Payment', 'LC Opening') NOT NULL,
    due_date DATE NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Logistics Tracking Table
CREATE TABLE IF NOT EXISTS logistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL UNIQUE,
    shipping_company VARCHAR(100),
    vessel_name VARCHAR(100),
    etd DATE, -- Estimated Time of Departure
    eta DATE, -- Estimated Time of Arrival
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Document Vault Table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    document_type ENUM('Proforma Invoice', 'LC Copy', 'Yard Photo', 'JAAI', 'E-Certificate', 'Bank Release', 'CUSDEC', 'Other') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- RMV Registration Tracking Table
CREATE TABLE IF NOT EXISTS rmv_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL UNIQUE,
    has_id_copy BOOLEAN DEFAULT FALSE,
    has_gs_certificate BOOLEAN DEFAULT FALSE,
    has_tin_certificate BOOLEAN DEFAULT FALSE,
    has_mt2_form BOOLEAN DEFAULT FALSE,
    registration_number VARCHAR(50),
    status ENUM('Pending Documents', 'Submitted to RMV', 'Completed') DEFAULT 'Pending Documents',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Investors Table
CREATE TABLE IF NOT EXISTS investors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Investments Table
CREATE TABLE IF NOT EXISTS vehicle_investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    invested_amount DECIMAL(15, 2) NOT NULL,
    roi_percentage DECIMAL(5, 2), -- e.g., 5.00 for 5%
    profit_share_amount DECIMAL(15, 2), -- Calculated upon final sale
    status ENUM('Active', 'Settled') DEFAULT 'Active',
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Dynamic Expenses Table (For Final Invoice Calculation)
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    expense_type ENUM('Demurrage', 'Port Charge', 'Clearing Agent Fee', 'Transport', 'Other') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    date_incurred DATE NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Website Leads (Contact Form) Table
CREATE TABLE IF NOT EXISTS website_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    status ENUM('New', 'Contacted', 'Converted', 'Closed') DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
