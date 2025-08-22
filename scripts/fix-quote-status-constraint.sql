-- First, let's see what values are currently in the quotes table
SELECT DISTINCT status FROM quotes WHERE status IS NOT NULL;

-- Check the current constraint definition
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'quotes'::regclass 
AND contype = 'c' 
AND conname = 'quotes_status_check';

-- If the constraint is too restrictive, we'll drop it and create a new one
-- This allows the common status values that make sense for a quote system
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('pending', 'quoted', 'approved', 'rejected', 'completed', 'cancelled'));

-- Update any existing invalid statuses to 'pending'
UPDATE quotes SET status = 'pending' WHERE status NOT IN ('pending', 'quoted', 'approved', 'rejected', 'completed', 'cancelled');
