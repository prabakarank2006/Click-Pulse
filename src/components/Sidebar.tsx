import React, { useState } from "react";
import { 
  Link2, 
  BarChart3, 
  Users, 
  Key, 
  Database, 
  Sun, 
  Moon, 
  Bell, 
  ShieldCheck, 
  ChevronDown, 
  Globe2, 
  Menu, 
  X,
  Gauge
} from "lucide-react";
import { Persona, Team, SystemNotification } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  personas: Persona[];
  activePersona: Persona;
  setActivePersona: (p: Persona) => void;
  teams: Team[];
  activeTeam: Team | null;
  setActiveTeamId: (id: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  notifications: SystemNotification[];
  onMarkNotificationsRead: () => void;
  onSimulateClicks: () => void;
  isSimulating: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  personas,
  activePersona,
  setActivePersona,
  teams,
  activeTeam,
  setActiveTeamId,
  isDark,
  setIsDark,
  notifications,
  onMarkNotificationsRead,
  onSimulateClicks,
  isSimulating,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navigationItems = [
    { id: "dashboard", label: "Analytics Dashboard", icon: BarChart3 },
    { id: "links", label: "Link Management", icon: Link2 },
    { id: "team", label: "Team Members (RBAC)", icon: Users },
    { id: "apikeys", label: "Developer APIs", icon: Key },
    { id: "sql", label: "Supabase DB Schema", icon: Database },
  ];

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = personas.find((p) => p.user_id === e.target.value);
    if (selected) {
      setActivePersona(selected);
      // Automatically switch team if the persona belongs to another team
      setActiveTeamId(selected.team_id);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveTeamId(e.target.value);
  };

  const limitPercentage = activeTeam 
    ? Math.min(100, Math.round((activeTeam.current_usage / activeTeam.plan_limit) * 100))
    : 0;

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Link2 className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">OwnYourClick</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifPopover(!showNotifPopover);
                if (unreadCount > 0) onMarkNotificationsRead();
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-bounce" />
              )}
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 lg:z-30 flex flex-col transform lg:transform-none transition-transform duration-300 ease-in-out lg:sticky lg:top-0 h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight block">OwnYourClick</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono tracking-widest uppercase">Link Optimizer</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Sandbox Switchees */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 space-y-3.5">
          {/* Persona Switchee (Role Playground) */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> System Persona (RBAC Test)
            </label>
            <div className="relative">
              <select 
                value={activePersona.user_id} 
                onChange={handlePersonaChange}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {personas.map((p) => (
                  <option key={p.user_id} value={p.user_id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active Workspace Switcher */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Globe2 className="h-3 w-3" /> Isolated Team Workspace
            </label>
            <div className="relative">
              <select 
                value={activeTeam?.id || ""} 
                onChange={handleTeamChange}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Real-time simulation trigger block */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <button 
            onClick={onSimulateClicks}
            disabled={isSimulating}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border shadow-sm transition-all flex items-center justify-center gap-2 ${
              isSimulating
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                : "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900"
            }`}
          >
            <Gauge className={`h-3.5 w-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            {isSimulating ? "Injecting Traffic..." : "Simulate Instant Traffic"}
          </button>
        </div>

        {/* Team Subscription Tier Limit Gauge */}
        {activeTeam && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Workspace Usage Limit</span>
              <span className={`font-mono font-bold ${limitPercentage > 90 ? "text-red-500 animate-pulse" : (limitPercentage > 50 ? "text-amber-500" : "text-slate-700 dark:text-slate-300")}`}>
                {activeTeam.current_usage} / {activeTeam.plan_limit} clicks
              </span>
            </div>
            
            {/* Progress Gauge */}
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  limitPercentage > 90 
                    ? "bg-red-500" 
                    : (limitPercentage > 60 ? "bg-amber-500" : "bg-gradient-to-r from-indigo-500 to-purple-500")
                }`}
                style={{ width: `${limitPercentage}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-normal">
              {limitPercentage > 90 
                ? "Critical: Limit exceeded. Upgrade tier to prevent routing pauses."
                : "Continuous Click tracking active"}
            </p>
          </div>
        )}

        {/* Footer Settings & Theme Toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              {activePersona.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="truncate max-w-[120px]">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">{activePersona.name}</span>
              <span className="block text-[10px] text-slate-400 capitalize font-mono leading-none">{activePersona.role}</span>
            </div>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            title="Toggle theme mode"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
    </>
  );
}
