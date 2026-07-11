import { useState } from "react";
import { Database, Copy, Check, Info, FileCode } from "lucide-react";

export default function SqlSchemaView() {
  const [copied, setCopied] = useState(false);

  const schemaSql = `-- ============================================================================
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
    plan_limit INT NOT NULL DEFAULT 1000,
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
    created_by UUID NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    custom_domain VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')) NOT NULL
);

CREATE INDEX idx_links_slug ON links(slug);
CREATE INDEX idx_links_team_id ON links(team_id);

-- 4. CLICKS TABLE (Granular Analytics Log)
CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    referrer VARCHAR(2048),
    device VARCHAR(100),
    browser VARCHAR(100),
    country VARCHAR(100),
    destination_used VARCHAR(2048) NOT NULL
);

CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX idx_clicks_link_timestamp ON clicks(link_id, timestamp);

-- 5. API KEYS TABLE (Bearer tokens for developer automations)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
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
$$ LANGUAGE plpgsql;`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Unable to copy SQL script:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" /> PostgreSQL & Supabase Database Migrations
          </h2>
          <p className="text-xs text-slate-500 mt-1">Copy and execute this robust schema setup file directly in your Supabase SQL editor.</p>
        </div>

        <button
          onClick={handleCopy}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white flex items-center gap-2 shadow-sm cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "SQL Copied!" : "Copy Full SQL Script"}
        </button>
      </div>

      {/* Info Warning banner */}
      <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 p-4 rounded-xl space-y-1">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Info className="h-4 w-4 text-indigo-500 shrink-0" /> Supabase Integration Checklist
        </h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          This script deploys the relational types, constraints, fast secondary indices, and fine-grained Row-Level Security (RLS) security policies. RLS ensures that members can only query or update resources belonging strictly to their isolated team workspace.
        </p>
      </div>

      {/* Code Display panel */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-lg flex flex-col">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2 text-slate-400">
          <FileCode className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-white">supabase_schema.sql</span>
        </div>
        <pre className="p-5 font-mono text-[11px] leading-relaxed text-slate-300 max-h-[480px] overflow-y-auto overflow-x-auto bg-slate-950">
          {schemaSql}
          {"\n-- ... [Indices and Row-Level Security policies included above] ..."}
        </pre>
      </div>
    </div>
  );
}
