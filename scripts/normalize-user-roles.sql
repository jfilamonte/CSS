-- Script to normalize inconsistent role names in database
UPDATE users 
SET role = 'sales_rep' 
WHERE role IN ('sales_person', 'salesperson', 'sales');

UPDATE users 
SET role = 'admin' 
WHERE role IN ('super_admin', 'ADMIN');

UPDATE users 
SET role = 'customer' 
WHERE role = 'CUSTOMER';

UPDATE users 
SET role = 'staff' 
WHERE role = 'STAFF';

-- Verify the normalization
SELECT DISTINCT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;
