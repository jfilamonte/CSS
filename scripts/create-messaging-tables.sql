-- Create messages table for customer-admin communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table for live chat on homepage
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('visitor', 'admin')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_visitor ON chat_messages(visitor_id);
