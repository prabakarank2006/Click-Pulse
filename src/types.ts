export interface Destination {
  url: string;
  weight: number;
}

export interface ShortLink {
  id: string;
  slug: string;
  title: string;
  destinations: Destination[];
  created_at: string;
  created_by: string;
  team_id: string;
  clicks_count: number;
  custom_domain?: string;
  status: 'active' | 'paused';
}

export interface ClickRecord {
  id: string;
  link_id: string;
  timestamp: string;
  referrer: string;
  device: string;
  browser: string;
  country: string;
  destination_used: string;
}

export interface Team {
  id: string;
  name: string;
  plan_limit: number;
  current_usage: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'Admin' | 'Member' | 'Viewer';
  name: string;
  email: string;
}

export interface ApiKey {
  id: string;
  team_id: string;
  user_id?: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
}

export interface SystemNotification {
  id: string;
  team_id: string;
  title: string;
  message: string;
  type: 'metrics' | 'subscription' | 'rbac';
  created_at: string;
  read: boolean;
}

export interface Persona {
  user_id: string;
  name: string;
  email: string;
  team_id: string;
  role: 'Admin' | 'Member' | 'Viewer';
}
