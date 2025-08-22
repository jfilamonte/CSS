-- Find the exact constraint definition for users.role
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%role%' 
AND conrelid = 'public.users'::regclass;

-- Also check what role values currently exist in the database
SELECT DISTINCT role FROM public.users WHERE role IS NOT NULL;

-- Check if there are any enum types for roles
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%';
