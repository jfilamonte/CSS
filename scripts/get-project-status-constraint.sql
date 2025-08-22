-- Get the exact constraint definition for projects status
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'projects' 
AND conname = 'projects_status_check';

-- Also check what status values currently exist in the projects table
SELECT DISTINCT status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY status;

-- Check if there's an enum type for project status
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'project_status'
);
