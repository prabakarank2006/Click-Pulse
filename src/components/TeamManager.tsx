import React, { useState } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Mail, 
  Briefcase, 
  Globe2, 
  Lock,
  PlusCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { TeamMember, Team } from "../types";

interface TeamManagerProps {
  activeTeam: Team | null;
  userRole: 'Admin' | 'Member' | 'Viewer';
  members: TeamMember[];
  onAddMember: (name: string, email: string, role: 'Admin' | 'Member' | 'Viewer') => Promise<boolean>;
  onRemoveMember: (id: string) => Promise<boolean>;
}

export default function TeamManager({
  activeTeam,
  userRole,
  members,
  onAddMember,
  onRemoveMember,
}: TeamManagerProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<'Admin' | 'Member' | 'Viewer'>("Viewer");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = userRole === "Admin";

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAdmin) {
      setError("Only workspace Admins hold authorization to invite members.");
      return;
    }

    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      setError("Please complete all fields (name and email).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail.trim())) {
      setError("Please input a valid email address.");
      return;
    }

    const successFlag = await onAddMember(newMemberName.trim(), newMemberEmail.trim(), newMemberRole);
    if (successFlag) {
      setSuccess(`${newMemberName} was successfully invited to the workspace as a ${newMemberRole}!`);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("Viewer");
      setShowInviteForm(false);
    } else {
      setError("Failed to invite member. Please try again.");
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to remove ${name} from this workspace?`)) {
      const successFlag = await onRemoveMember(id);
      if (successFlag) {
        setSuccess(`${name} was successfully removed from the workspace.`);
      } else {
        setError(`Failed to remove ${name}.`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" /> Team Management & RBAC
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage granular workspace accessibility roles and team boundaries.</p>
        </div>

        {isAdmin && !showInviteForm && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" /> Invite Member
          </button>
        )}
      </div>

      {/* Isolation explanation banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950/60 p-5 rounded-2xl border border-indigo-100/40 dark:border-slate-800 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Globe2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Team Isolation Guarantee</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              All short URLs, campaign statistics, logs, and developer API credentials are strictly bounded within <strong>{activeTeam?.name}</strong>. No cross-team leaks are mathematically possible on our database layer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shrink-0 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Isolated
        </div>
      </div>

      {/* Role Definitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Admin Role</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Full workspace controller. Manage subscription tiers, generate REST developer tokens, invite and remove members, modify team mapping.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Member Role</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Campaign builder. Full access to create, modify, pause, or resume short URLs, customize split A/B weights, and review analytics dashboards.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Viewer Role</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Read-Only partner. Direct visualizer access to metrics dashboards and short URLs tables. Prohibited from mutating any links, members, or keys.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200/50 dark:border-red-900/40 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl border border-green-200/50 dark:border-green-900/40 text-xs flex items-center gap-2.5 animate-fadeIn">
          <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Invite Member Form */}
      {showInviteForm && isAdmin && (
        <form onSubmit={handleInviteSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white text-sm">Send Member Workspace Invitation</span>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Corporate Email</label>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="sarah@skynet.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Workspace Role Assign</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Member">Member (Campaign Creator)</option>
                <option value="Viewer">Viewer (Read-Only)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Authorize & Dispatch Invitation
          </button>
        </form>
      )}

      {/* Member List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Authorized Workspace Members</span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            {members.length} members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 bg-slate-50/30 dark:bg-slate-950/10">
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role Badge</th>
                <th className="px-6 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {members.map((member) => {
                const isCurrentPersona = member.name === "Sarah Jenkins"; // proxy check
                return (
                  <tr key={member.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                          {member.name}
                          {isCurrentPersona && (
                            <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-500 font-sans font-medium">You</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 font-medium">{member.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        member.role === "Admin"
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : (member.role === "Member" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400" : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400")
                      }`}>
                        {member.role === "Admin" ? <ShieldCheck className="h-3 w-3" /> : (member.role === "Member" ? <Shield className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />)}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        disabled={!isAdmin || isCurrentPersona}
                        className={`p-1.5 rounded-lg border transition-all ${
                          !isAdmin || isCurrentPersona
                            ? "border-slate-100 text-slate-200 cursor-not-allowed dark:border-slate-850 dark:text-slate-800"
                            : "border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-950/30 dark:hover:bg-red-950/20"
                        }`}
                        title={!isAdmin ? "Admin privileges required" : (isCurrentPersona ? "Cannot remove yourself" : "Remove member")}
                      >
                        {!isAdmin ? <Lock className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
