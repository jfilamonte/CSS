-- Updated to match existing database schema and add performance indexes
-- The error_logs table already exists, just adding indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Enable RLS if not already enabled
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'error_logs' 
        AND policyname = 'Admin can view all error logs'
    ) THEN
        CREATE POLICY "Admin can view all error logs" ON error_logs
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role IN ('admin', 'ADMIN')
            )
          );
    END IF;
END $$;
