SELECT 
  id, 
  title, 
  status, 
  progress_percentage,
  created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- Also check what status values actually exist
SELECT DISTINCT status FROM projects WHERE status IS NOT NULL;

-- Check if the specific project exists
SELECT * FROM projects WHERE id = 'f17ed023-c5b0-4b47-9735-f7277573bf7a';
