-- =============================================================
--  D&N Automart — database changes (2026-07-21)
--  Safe to re-run: every statement is idempotent.
--  Apply to any environment that has not received these yet
--  (e.g. the production database).
--
--  Usage (CLI):
--    mysql -u root -p automobile < backend/config/upgrade_2026_07_21.sql
--  Or paste into phpMyAdmin → automobile → SQL tab.
-- =============================================================


-- -------------------------------------------------------------
-- 1) Corporate Cashbook expenses table
--
--    Why: the table was missing entirely, so every "Record
--    Expense" submit failed with a 500 and nothing was saved —
--    the ledger stayed empty and profit never moved.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cashbook_expenses (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    expense_type  VARCHAR(100)   NOT NULL,
    amount        DECIMAL(15, 2) NOT NULL,
    description   TEXT,
    date_incurred DATE           NOT NULL,
    created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
-- 2) Website leads: allow the 'Completed' status
--
--    Why: the CRM "Mark Complete" button writes 'Completed',
--    but that value was not in the ENUM. MySQL is not in strict
--    mode here, so it silently stored an EMPTY string instead —
--    the status badge went blank and completion never persisted.
-- -------------------------------------------------------------
ALTER TABLE website_leads
    MODIFY status ENUM('New','Contacted','Converted','Closed','Completed')
    DEFAULT 'New';

-- Repair rows that were blanked by the bug above (they were the
-- ones the user had actually marked complete).
UPDATE website_leads
   SET status = 'Completed'
 WHERE status = '' OR status IS NULL;
