-- Get the exact constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'projects_status_check';

-- Get all existing status values currently in the projects table
SELECT DISTINCT status, COUNT(*) as count
FROM projects 
GROUP BY status 
ORDER BY count DESC;

-- Get the table definition to see the status column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'status';
