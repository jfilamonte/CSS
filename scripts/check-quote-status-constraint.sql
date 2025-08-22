-- Check the exact values allowed by the quotes_status_check constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'quotes' 
AND n.nspname = 'public'
AND conname = 'quotes_status_check';

-- Also check what status values currently exist in the quotes table
SELECT DISTINCT status FROM quotes WHERE status IS NOT NULL;
