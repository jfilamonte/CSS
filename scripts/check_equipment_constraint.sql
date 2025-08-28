-- Query to check the actual equipment status constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'equipment_status_check' 
AND conrelid = 'equipment'::regclass;

-- Also check what status values currently exist in the table
SELECT DISTINCT status FROM equipment WHERE status IS NOT NULL;
