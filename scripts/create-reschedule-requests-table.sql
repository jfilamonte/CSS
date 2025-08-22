-- Create reschedule_requests table for managing appointment reschedule requests
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by VARCHAR(20) DEFAULT 'customer' CHECK (requested_by IN ('customer', 'admin')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_appointment_id ON reschedule_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON reschedule_requests(status);
