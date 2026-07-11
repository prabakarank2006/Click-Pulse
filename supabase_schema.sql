-- ============================================================================
-- Supabase PostgreSQL Schema Setup for OwnYourClick Link Management Platform
-- ============================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE member_role AS ENUM ('Admin', 'Member', 'Viewer');
CREATE TYPE notification_type AS ENUM ('metrics', 'subscription', 'rbac');

-- 1. TEAMS TABLE
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_limit INT NOT NULL DEFAULT 1000, -- Monthly click capacity limit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. TEAM MEMBERS TABLE (RBAC Map)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL, -- Corresponds to auth.users.id in Supabase Auth
    role member_role NOT NULL DEFAULT 'Viewer',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(team_id, user_id)
);

-- 3. LINKS TABLE (Supports A/B routing destinations stored as JSONB)
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    destinations JSONB NOT NULL, -- Array of { "url": "...", "weight": 60 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL, -- Corresponds to auth.users.id
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    custom_domain VARCHAR(255), -- For custom CNAME branding
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')) NOT NULL
);

-- Create index on slug for fast redirection lookups
CREATE INDEX idx_links_slug ON links(slug);
-- Create index on team_id to isolate workspaces
CREATE INDEX idx_links_team_id ON links(team_id);

-- 4. CLICKS TABLE (Granular Analytics Log)
CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referrer VARCHAR(2048),
    device VARCHAR(100),
    browser VARCHAR(100),
    country VARCHAR(100), -- GeoIP resolved country code/name
    destination_used VARCHAR(2048) NOT NULL -- URL actually chosen during A/B split
);

-- Indexes for lightning-fast analytics querying & reporting
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX idx_clicks_link_timestamp ON clicks(link_id, timestamp);

-- 5. API KEYS TABLE (Bearer tokens for developer automations)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL, -- Hashed or unhashed developer token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_token ON api_keys(key);

-- 6. SYSTEM NOTIFICATIONS TABLE (For real-time alert pushes)
CREATE TABLE system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_notifications_team ON system_notifications(team_id, read);


-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check if user is member of a team
CREATE OR REPLACE FUNCTION auth.is_team_member(team_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_members.team_id = $1 
    AND team_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- Helper security function: Get user role in team
CREATE OR REPLACE FUNCTION auth.get_team_role(team_id UUID)
RETURNS member_role SECURITY DEFINER AS $$
DECLARE
  user_role member_role;
BEGIN
  SELECT role INTO user_role FROM public.team_members 
  WHERE team_members.team_id = $1 
  AND team_members.user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;


-- POLICIES FOR TEAMS
CREATE POLICY "Users can view teams they belong to" ON teams
    FOR SELECT USING (auth.is_team_member(id));

-- POLICIES FOR TEAM_MEMBERS
CREATE POLICY "Users can view members of their team" ON team_members
    FOR SELECT USING (auth.is_team_member(team_id));

CREATE POLICY "Admins can manage team members" ON team_members
    FOR ALL USING (auth.get_team_role(team_id) = 'Admin');


-- POLICIES FOR LINKS
CREATE POLICY "Team members can read team links" ON links
    FOR SELECT USING (auth.is_team_member(team_id));

CREATE POLICY "Admins and Members can modify links" ON links
    FOR ALL USING (
        auth.is_team_member(team_id) AND 
        auth.get_team_role(team_id) IN ('Admin', 'Member')
    );


-- POLICIES FOR CLICKS
CREATE POLICY "Team members can view click records" ON clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM links 
            WHERE links.id = clicks.link_id 
            AND auth.is_team_member(links.team_id)
        )
    );

-- Fast public ingestion policy for redirection microservice (bypasses auth for inserts)
CREATE POLICY "Public redirection can insert clicks" ON clicks
    FOR INSERT WITH CHECK (true);


-- POLICIES FOR API_KEYS
CREATE POLICY "Admins can manage API Keys" ON api_keys
    FOR ALL USING (auth.get_team_role(team_id) = 'Admin');

CREATE POLICY "Members can view API Keys" ON api_keys
    FOR SELECT USING (
        auth.is_team_member(team_id) AND 
        auth.get_team_role(team_id) IN ('Admin', 'Member')
    );


-- POLICIES FOR SYSTEM_NOTIFICATIONS
CREATE POLICY "Team members can view notifications" ON system_notifications
    FOR SELECT USING (auth.is_team_member(team_id));

CREATE POLICY "Admins can mark notifications as read" ON system_notifications
    FOR UPDATE USING (
        auth.is_team_member(team_id) AND 
        auth.get_team_role(team_id) = 'Admin'
    );


-- ============================================================================
-- Seed Data (For quick initialization / local deployment)
-- ============================================================================

-- Insert sample team
INSERT INTO teams (id, name, plan_limit) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Acme Marketing', 10000);

-- Insert team members (Admin, Member, Viewer)
INSERT INTO team_members (team_id, user_id, role, name, email) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Admin', 'Sarah Jenkins', 'sarah@acme.com'),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Member', 'Alex River', 'alex@acme.com'),
('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Viewer', 'Jordan Smith', 'jordan@acme.com');

-- Insert dynamic shortened link with A/B split (60/40)
INSERT INTO links (id, slug, title, destinations, created_by, team_id) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'winter-sale', 'Winter Promo Campaign', 
 '[{"url": "https://example.com/promo-variant-a", "weight": 60}, {"url": "https://example.com/promo-variant-b", "weight": 40}]'::jsonb,
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111');
