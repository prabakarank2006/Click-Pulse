import { useState, useEffect } from "react";
import { 
  Bell, 
  Sparkles, 
  Terminal, 
  HelpCircle, 
  Radio, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight, 
  X,
  Zap,
  Info
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import AnalyticsView from "./components/AnalyticsView";
import LinkManager from "./components/LinkManager";
import TeamManager from "./components/TeamManager";
import ApiKeyManager from "./components/ApiKeyManager";
import SqlSchemaView from "./components/SqlSchemaView";
import { Persona, Team, TeamMember, ApiKey, SystemNotification, ShortLink } from "./types";

const mockPersonas: Persona[] = [
  { user_id: "u1", name: "Sarah Jenkins", email: "sarah@acme.com", team_id: "11111111-1111-1111-1111-111111111111", role: "Admin" },
  { user_id: "u2", name: "Alex River", email: "alex@acme.com", team_id: "11111111-1111-1111-1111-111111111111", role: "Member" },
  { user_id: "u3", name: "Jordan Smith", email: "jordan@acme.com", team_id: "11111111-1111-1111-1111-111111111111", role: "Viewer" },
];

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'metrics' | 'subscription' | 'rbac';
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDark, setIsDark] = useState(true);

  // Playground Persona and Team Switchers
  const [activePersona, setActivePersona] = useState<Persona>(mockPersonas[0]);
  const [activeTeamId, setActiveTeamId] = useState("11111111-1111-1111-1111-111111111111");

  // Server state data
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Member' | 'Viewer'>("Admin");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [links, setLinks] = useState<ShortLink[]>([]);
  
  // Real-time toast state
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [sseActive, setSseActive] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Available Teams List (Fetched from server)
  const [teams, setTeams] = useState<Team[]>([]);

  // Push helper for toasts
  const pushToast = (title: string, message: string, type: 'metrics' | 'subscription' | 'rbac') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Auto purge toast after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // 1. Initial Teams List loading
  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Error loading teams list:", err));
  }, []);

  // 2. Load workspace parameters
  const loadWorkspaceDetails = async () => {
    try {
      // Load Team/Role/Keys metadata
      const resMeta = await fetch(`/api/workspace?team_id=${activeTeamId}&user_id=${activePersona.user_id}`);
      const dataMeta = await resMeta.json();
      
      setActiveTeam(dataMeta.team);
      setUserRole(dataMeta.user_role);
      setMembers(dataMeta.members);
      setApiKeys(dataMeta.api_keys);
      setNotifications(dataMeta.notifications);

      // Load Links
      const resLinks = await fetch(`/api/links?team_id=${activeTeamId}`);
      const dataLinks = await resLinks.json();
      setLinks(dataLinks);
    } catch (err) {
      console.error("Error syncing full workspace details:", err);
    }
  };

  useEffect(() => {
    loadWorkspaceDetails();
  }, [activeTeamId, activePersona]);

  // 3. SSE Stream connection for real-time live events!
  useEffect(() => {
    const sse = new EventSource("/api/notifications/stream");
    setSseActive(true);

    sse.onopen = () => {
      console.log("[SSE EventSource] Real-time stream successfully activated.");
      setSseActive(true);
    };

    sse.onerror = (e) => {
      console.warn("[SSE EventSource] Disconnected from stream or failed, falling back to manual synchronization.");
      setSseActive(false);
    };

    // Click trigger broadcast channel
    sse.addEventListener("click_recorded", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        // Instant visual browser toast alert
        pushToast(
          "Link Click Recorded",
          `Slug /r/${payload.slug} was clicked from ${payload.click.country} using a ${payload.click.device} browser.`,
          "metrics"
        );
        // Refresh active workspace statistics & clicks count
        loadWorkspaceDetails();
      } catch (err) {
        console.error(err);
      }
    });

    // Link created broadcast channel
    sse.addEventListener("link_created", (e: any) => {
      try {
        loadWorkspaceDetails();
      } catch (err) {
        console.error(err);
      }
    });

    // Standard notification alert broadcast channel
    sse.addEventListener("notification", (e: any) => {
      try {
        const notif = JSON.parse(e.data);
        pushToast(notif.title, notif.message, notif.type);
        loadWorkspaceDetails();
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      sse.close();
    };
  }, [activeTeamId, activePersona]);

  // Handle addition of Link campaign
  const handleAddLink = async (payload: Omit<ShortLink, 'id' | 'clicks_count' | 'created_at' | 'created_by'>): Promise<boolean> => {
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          user_role: userRole,
        }),
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error creating campaign link:", err);
    }
    return false;
  };

  // Handle update of Link (status pause/resume or split weights modification)
  const handleUpdateLink = async (id: string, updates: Partial<ShortLink>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updates,
          user_role: userRole,
        }),
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error editing campaign link:", err);
    }
    return false;
  };

  // Handle link removal
  const handleDeleteLink = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/links/${id}?user_role=${userRole}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error deleting campaign link:", err);
    }
    return false;
  };

  // Handle Member invitation additions
  const handleAddMember = async (name: string, email: string, role: 'Admin' | 'Member' | 'Viewer'): Promise<boolean> => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: activeTeamId,
          user_role: userRole,
          name,
          email,
          role,
        }),
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error inviting workspace member:", err);
    }
    return false;
  };

  // Handle Member removal
  const handleRemoveMember = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/members/${id}?user_role=${userRole}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error removing member from workspace:", err);
    }
    return false;
  };

  // Handle API Key generation (Admin only)
  const handleGenerateKey = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: activeTeamId,
          user_role: userRole,
          name,
        }),
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error generating developer integration token:", err);
    }
    return false;
  };

  // Handle API Key revocation
  const handleRevokeKey = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/keys/${id}?user_role=${userRole}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadWorkspaceDetails();
        return true;
      }
    } catch (err) {
      console.error("Error revoking developer token:", err);
    }
    return false;
  };

  // Mark all workspace notifications read
  const handleMarkNotificationsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: activeTeamId }),
      });
      // Simple local mapping state update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  // Simulate traffic debug helper
  const handleSimulateClicks = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/simulate-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: activeTeamId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Simulation failed");
      }
    } catch (err) {
      console.error("Error simulating link click traffic:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
        
        {/* Responsive Sidebar Controller */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          personas={mockPersonas}
          activePersona={activePersona}
          setActivePersona={setActivePersona}
          teams={teams}
          activeTeam={activeTeam}
          setActiveTeamId={setActiveTeamId}
          isDark={isDark}
          setIsDark={setIsDark}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onSimulateClicks={handleSimulateClicks}
          isSimulating={isSimulating}
        />

        {/* Content Container */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          
          {/* Main Desktop Header Path Tracker */}
          <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span className="font-mono text-slate-500 font-bold">{activeTeam?.name || "Workspace"}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="capitalize text-slate-700 dark:text-slate-200">
                {activeTab === "apikeys" ? "Developer API Tokens" : (activeTab === "sql" ? "Supabase DB Config" : activeTab)}
              </span>
            </div>

            {/* SSE status and real-time trackers */}
            <div className="flex items-center gap-5">
              {/* SSE Stream status indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full">
                <span className={`h-2 w-2 rounded-full ${sseActive ? "bg-green-500 animate-pulse" : "bg-amber-400"}`} />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {sseActive ? "Live Stream Sync Active" : "Polling Mode Enabled"}
                </span>
              </div>

              {/* Persona and role display indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/20 dark:border-indigo-900/40 rounded-full text-xs">
                {userRole === "Admin" ? (
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-slate-400" />
                )}
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Role: <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">{userRole}</span>
                </span>
              </div>
            </div>
          </header>

          {/* Core Content Area */}
          <div className="flex-1 p-5 lg:p-8 space-y-6">
            {activeTab === "dashboard" && (
              <AnalyticsView activeTeamId={activeTeamId} links={links} />
            )}

            {activeTab === "links" && (
              <LinkManager
                activeTeamId={activeTeamId}
                userRole={userRole}
                links={links}
                onAddLink={handleAddLink}
                onUpdateLink={handleUpdateLink}
                onDeleteLink={handleDeleteLink}
              />
            )}

            {activeTab === "team" && (
              <TeamManager
                activeTeam={activeTeam}
                userRole={userRole}
                members={members}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
              />
            )}

            {activeTab === "apikeys" && (
              <ApiKeyManager
                userRole={userRole}
                apiKeys={apiKeys}
                onGenerateKey={handleGenerateKey}
                onRevokeKey={handleRevokeKey}
              />
            )}

            {activeTab === "sql" && (
              <SqlSchemaView />
            )}
          </div>
        </main>

        {/* Floating Desktop Toast Notification Hub */}
        <div className="fixed bottom-5 right-5 z-50 space-y-3.5 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div 
              key={t.id} 
              className="p-4 bg-slate-900 dark:bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 pointer-events-auto flex gap-3 animate-fadeIn relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
              <div className="p-1.5 bg-slate-800 rounded-xl text-indigo-400 shrink-0 h-fit">
                <Zap className="h-4 w-4 animate-bounce" />
              </div>
              <div className="space-y-1 pr-4">
                <h5 className="text-xs font-bold tracking-tight text-white">{t.title}</h5>
                <p className="text-[10px] text-slate-400 leading-normal">{t.message}</p>
              </div>
              <button 
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                className="text-slate-500 hover:text-white p-1 absolute top-2 right-2 rounded-lg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
