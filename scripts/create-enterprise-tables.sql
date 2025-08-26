-- Create workflow automation tables
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID REFERENCES workflow_triggers(id),
  event TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logging table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table for workflow automation
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CMS content table
CREATE TABLE IF NOT EXISTS cms_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_trigger ON workflow_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

-- Insert default workflow triggers
INSERT INTO workflow_triggers (name, event, conditions, actions) VALUES
('New Project Created', 'project_created', '{}', '[
  {"type": "notification", "config": {"title": "New Project Created", "message": "A new project has been created", "type": "info"}},
  {"type": "email", "config": {"template": "project_created", "recipient": "admin"}}
]'),
('Customer Registration', 'customer_registered', '{}', '[
  {"type": "email", "config": {"template": "welcome", "recipient": "customer"}},
  {"type": "create_task", "config": {"title": "Follow up with new customer", "description": "Contact new customer within 24 hours"}}
]'),
('Project Status Change', 'project_status_changed', '{"status": "completed"}', '[
  {"type": "email", "config": {"template": "project_completed", "recipient": "customer"}},
  {"type": "notification", "config": {"title": "Project Completed", "message": "Project has been marked as completed", "type": "success"}}
]')
ON CONFLICT DO NOTHING;

-- Insert default CMS content
INSERT INTO cms_content (page, content) VALUES
('homepage', '{
  "hero_title": "Professional Epoxy Flooring Solutions",
  "hero_subtitle": "Transform your space with durable, beautiful epoxy floors",
  "services": [
    {"title": "Residential Epoxy", "description": "Beautiful floors for your home"},
    {"title": "Commercial Flooring", "description": "Durable solutions for businesses"},
    {"title": "Industrial Coatings", "description": "Heavy-duty floor protection"}
  ]
}'),
('about', '{
  "title": "About Crafted Surface Solutions",
  "content": "We are experts in epoxy flooring with years of experience delivering quality results.",
  "team": [
    {"name": "John Doe", "role": "Lead Installer", "experience": "10+ years"}
  ]
}')
ON CONFLICT (page) DO NOTHING;
