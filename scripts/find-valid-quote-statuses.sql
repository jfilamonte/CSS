-- Check what status values currently exist in the quotes table
SELECT DISTINCT status FROM quotes WHERE status IS NOT NULL;

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'quotes_status_check';

-- Also check if there are any enum types for status
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%status%'
ORDER BY e.enumsortorder;
