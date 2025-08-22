-- Create sales rep availability table
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

-- Create sales rep blocked times table
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

-- Create email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL, -- 'customer' or 'sales_rep'
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  related_id UUID, -- appointment_id, quote_id, etc.
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_rep_availability_rep_id ON sales_rep_availability(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_rep_availability_day ON sales_rep_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_sales_rep_blocked_times_rep_id ON sales_rep_blocked_times(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_rep_blocked_times_date ON sales_rep_blocked_times(blocked_date);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

-- Update users table to include sales_person role if not already present
DO $$
BEGIN
  -- Check if there's already a constraint on the role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'users' AND ccu.column_name = 'role' AND tc.constraint_type = 'CHECK'
  ) THEN
    -- Add constraint to allow sales_person role
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'customer', 'sales_person'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, do nothing
    NULL;
END $$;
