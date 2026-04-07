-- ==========================================
-- ROUND 4: ADD CSAT TO TICKETS
-- ==========================================

-- Add Customer Satisfaction (CSAT) fields
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS csat_score SMALLINT CHECK (csat_score >= 1 AND csat_score <= 5),
ADD COLUMN IF NOT EXISTS csat_review TEXT;
