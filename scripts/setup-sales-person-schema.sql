-- Add sales person role and availability tracking

-- First, let's add sales person availability table
CREATE TABLE IF NOT EXISTS sales_rep_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for blocked off times (vacations, meetings, etc.)
CREATE TABLE IF NOT EXISTS sales_rep_blocked_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_rep_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  is_all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_rep_availability_rep_id ON sales_rep_availability(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_rep_availability_day ON sales_rep_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_sales_rep_blocked_times_rep_id ON sales_rep_blocked_times(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_rep_blocked_times_date ON sales_rep_blocked_times(blocked_date);

-- Fixed constraint checking to use proper PostgreSQL syntax
-- Update users table to ensure sales_person role is valid (if constraint exists)
DO $$
BEGIN
  -- Check if there's a role constraint and update it if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'users' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%role%'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add new constraint that includes sales_person
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'customer', 'sales_person'));
  ELSE
    -- If no role constraint exists, add one
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'customer', 'sales_person'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- Create email notification log table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email VARCHAR NOT NULL,
  recipient_name VARCHAR,
  subject VARCHAR NOT NULL,
  template_type VARCHAR NOT NULL,
  template_data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  related_appointment_id UUID REFERENCES appointments(id),
  related_quote_id UUID REFERENCES quotes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_appointment ON email_notifications(related_appointment_id);
