-- Lease Invoice details saved per invoice (Invoices → view → "Lease Invoice")
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS `lease_invoices` (
  `invoice_id`      VARCHAR(50)    NOT NULL,
  `invoice_date`    DATE           DEFAULT NULL,
  `invoice_no`      VARCHAR(60)    DEFAULT NULL,
  `customer_name`   VARCHAR(191)   DEFAULT NULL,
  `address`         VARCHAR(255)   DEFAULT NULL,
  `tel_no`          VARCHAR(60)    DEFAULT NULL,
  `bank_name`       VARCHAR(150)   DEFAULT NULL,
  `bank_branch`     VARCHAR(150)   DEFAULT NULL,
  `for_sale`        VARCHAR(191)   DEFAULT NULL,
  `make`            VARCHAR(100)   DEFAULT NULL,
  `model`           VARCHAR(150)   DEFAULT NULL,
  `yom`             VARCHAR(20)    DEFAULT NULL,
  `engine_capacity` VARCHAR(50)    DEFAULT NULL,
  `chassis_number`  VARCHAR(100)   DEFAULT NULL,
  `engine_number`   VARCHAR(100)   DEFAULT NULL,
  `advance`         DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  `lease_amount`    DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  `balance`         DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  `total_cost`      DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  `director_name`   VARCHAR(150)   DEFAULT NULL,
  `created_at`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`invoice_id`),
  CONSTRAINT `lease_invoices_ibfk_1`
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
