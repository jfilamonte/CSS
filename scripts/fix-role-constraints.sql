-- Check current role constraint and fix it to support sales representatives
-- Based on research: RBAC systems need clear role definitions

-- First, check what roles currently exist
SELECT DISTINCT role FROM users WHERE role IS NOT NULL;

-- Check the current constraint definition
SELECT 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%role%';

-- Drop the existing role constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name LIKE '%role%'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
END $$;

-- Add a new constraint that supports all necessary roles
-- Based on research: Define clear roles based on job functions
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'customer', 'sales_rep', 'manager', 'staff'));

-- Create indexes for performance (research best practice)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Verify the constraint was added
SELECT 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%role%';
