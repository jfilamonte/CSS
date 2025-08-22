-- Check existing project status values and constraint definition
SELECT DISTINCT status FROM projects WHERE status IS NOT NULL;

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'projects_status_check';

-- Also check what values are used in related functions
SELECT 'Valid project statuses based on existing data and constraints' as info;
