-- Query to find the exact constraint definition for projects status
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'projects' 
    AND conname LIKE '%status%';

-- Also check what status values currently exist in the projects table
SELECT DISTINCT status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY count DESC;

-- Check if there are any enum types for project status
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%project%status%'
ORDER BY e.enumsortorder;
