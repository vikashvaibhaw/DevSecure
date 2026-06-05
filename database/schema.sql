-- USERS
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ORGANIZATIONS
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- MEMBERS (users belong to organizations)
CREATE TABLE members (
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT CHECK (role IN ('admin', 'developer', 'viewer')),
  PRIMARY KEY (user_id, organization_id)
);

-- SECRETS (encrypted values)
CREATE TABLE secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  key_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- GITHUB CONNECTIONS
CREATE TABLE github_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  repo_url TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SECURITY ALERTS
CREATE TABLE security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  alert_type TEXT,
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  description TEXT,
  fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);