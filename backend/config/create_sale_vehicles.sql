-- Vehicles For Sale: listings shown on the public website.
-- Each vehicle has one cover image plus up to 5 extra photos.
-- (The API also creates these tables automatically on first use.)

CREATE TABLE IF NOT EXISTS sale_vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    make VARCHAR(80) NULL,
    model VARCHAR(80) NULL,
    year SMALLINT NULL,
    mileage INT NULL,
    fuel_type VARCHAR(30) NULL,
    transmission VARCHAR(30) NULL,
    engine_cc INT NULL,
    color VARCHAR(40) NULL,
    vehicle_condition VARCHAR(30) NULL,
    price DECIMAL(14,2) NOT NULL DEFAULT 0,
    description TEXT NULL,
    cover_path VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sale_vehicle_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicle (vehicle_id),
    CONSTRAINT fk_sale_vehicle_images FOREIGN KEY (vehicle_id)
        REFERENCES sale_vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
