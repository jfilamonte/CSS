-- Create admin user if not exists
INSERT INTO users (email, role, first_name, last_name, is_active, created_at, updated_at)
VALUES ('jfilamonte@herculessas.com', 'admin', 'Admin', 'User', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_active = true,
  updated_at = NOW();

-- Verify the user was created/updated
SELECT email, role, is_active FROM users WHERE email = 'jfilamonte@herculessas.com';
