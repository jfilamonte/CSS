-- Check what role values currently exist in the users table
SELECT DISTINCT role FROM users WHERE role IS NOT NULL;

-- Check the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_role_check';
