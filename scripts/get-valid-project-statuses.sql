-- Query to find the actual valid status values for projects table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE conname = 'projects_status_check'
AND n.nspname = 'public'
AND cl.relname = 'projects';

-- Also check what status values currently exist in the projects table
SELECT DISTINCT status, COUNT(*) as count
FROM projects 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;
