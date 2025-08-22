-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('javascript', 'api', 'database', 'network', 'validation', 'auth')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100),
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('page_load', 'api_response', 'database_query', 'component_render')),
  metric_name VARCHAR(255) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('ms', 'bytes', 'count')),
  url TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type_severity ON error_logs(error_type, severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

-- Create updated_at trigger for error_logs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_error_logs_updated_at 
  BEFORE UPDATE ON error_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all error logs
CREATE POLICY "Admins can view all error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow admins to update error logs (for marking as resolved)
CREATE POLICY "Admins can update error logs" ON error_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow system to insert error logs
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Allow system to insert performance metrics
CREATE POLICY "System can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Allow admins to view performance metrics
CREATE POLICY "Admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
