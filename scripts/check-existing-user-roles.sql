-- Check what role values currently exist in the users table
SELECT DISTINCT role FROM users WHERE role IS NOT NULL;

-- Also check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'users' 
AND n.nspname = 'public'
AND conname LIKE '%role%';
