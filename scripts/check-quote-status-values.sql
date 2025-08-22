-- Check what status values currently exist in the quotes table
SELECT DISTINCT status FROM quotes WHERE status IS NOT NULL;

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'quotes_status_check';

-- If no constraint exists, let's see what we can find
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quotes' AND column_name = 'status';
