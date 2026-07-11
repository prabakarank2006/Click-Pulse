import React, { useState } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Lock, 
  Info, 
  Terminal, 
  Code,
  ShieldCheck,
  RotateCw,
  AlertCircle
} from "lucide-react";
import { ApiKey } from "../types";

interface ApiKeyManagerProps {
  userRole: 'Admin' | 'Member' | 'Viewer';
  apiKeys: ApiKey[];
  onGenerateKey: (name: string) => Promise<boolean>;
  onRevokeKey: (id: string) => Promise<boolean>;
}

export default function ApiKeyManager({
  userRole,
  apiKeys,
  onGenerateKey,
  onRevokeKey,
}: ApiKeyManagerProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const isAdmin = userRole === "Admin";

  const handleCopyKey = async (key: string, id: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (err) {
      console.error("Failed to copy API key:", err);
    }
  };

  const handleCopyCurl = async (curlText: string, label: string) => {
    try {
      await navigator.clipboard.writeText(curlText);
      setCopiedCurl(label);
      setTimeout(() => setCopiedCurl(null), 2000);
    } catch (err) {
      console.error("Failed to copy curl script:", err);
    }
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAdmin) {
      setError("Admin status is required to generate API integration tokens.");
      return;
    }

    if (!newKeyName.trim()) {
      setError("Please specify a descriptive label for the API Key.");
      return;
    }

    setLoading(true);
    const successFlag = await onGenerateKey(newKeyName.trim());
    setLoading(false);

    if (successFlag) {
      setSuccess(`API Key '${newKeyName}' was successfully provisioned!`);
      setNewKeyName("");
    } else {
      setError("Failed to create key.");
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to revoke the developer key '${name}'? All automated scripts using this credential will instantly break.`)) {
      const successFlag = await onRevokeKey(id);
      if (successFlag) {
        setSuccess(`Developer key '${name}' was permanently revoked.`);
      } else {
        setError(`Failed to revoke key.`);
      }
    }
  };

  const sampleToken = apiKeys[0]?.key || "oyc_live_9a8b7c6d5e";
  const domain = window.location.origin;

  const curlCreateString = `curl -X POST "${domain}/api/v1/links" \\
  -H "Authorization: Bearer ${sampleToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "slug": "flash-offer",
    "title": "Automated Flash campaign",
    "custom_domain": "sales.acme.com",
    "destinations": [
      {"url": "https://example.com/promo-v1", "weight": 70},
      {"url": "https://example.com/promo-v2", "weight": 30}
    ]
  }'`;

  const curlStatsString = `curl -X GET "${domain}/api/v1/links/dddddddd-dddd-dddd-dddd-dddddddddddd/stats" \\
  -H "Authorization: Bearer ${sampleToken}"`;

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Key className="h-5 w-5 text-indigo-600" /> Developer API & Automation
        </h2>
        <p className="text-xs text-slate-500 mt-1">Generate bearer tokens to automate short-link provisioning and statistical aggregation.</p>
      </div>

      {/* Grid: Keys table & Key generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Key Generator Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Lock className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Generate Token</h3>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-[11px] flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-[11px] flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Credential Name / Label</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                disabled={!isAdmin}
                placeholder="e.g. CI/CD Marketing pipeline"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isAdmin}
              className={`w-full py-2 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all ${
                !isAdmin
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-500/10"
              }`}
            >
              {loading ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {isAdmin ? "Generate Bearer Key" : "Admin Authorization Required"}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 leading-normal flex items-start gap-1">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              All API endpoints are strictly rate-limited and secured via Bearer token validation schemas on the node backend.
            </span>
          </p>
        </div>

        {/* Keys Table Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Developer tokens</span>
          </div>

          <div className="overflow-x-auto">
            {apiKeys.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 bg-slate-50/30 dark:bg-slate-950/10">
                    <th className="px-6 py-3.5">Key Name / Label</th>
                    <th className="px-6 py-3.5">Token Value</th>
                    <th className="px-6 py-3.5">Last Used</th>
                    <th className="px-6 py-3.5 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/15 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">{key.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Issued {new Date(key.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-800 w-fit">
                          <span>{key.key.substring(0, 12)}...</span>
                          <button
                            onClick={() => handleCopyKey(key.key, key.id)}
                            className="p-0.5 hover:text-indigo-500 text-slate-400 rounded transition-colors"
                          >
                            {copiedKeyId === key.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 font-medium">
                          {key.last_used ? new Date(key.last_used).toLocaleTimeString() : "Never"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevokeKey(key.id, key.name)}
                          disabled={!isAdmin}
                          className={`p-1.5 rounded-lg border transition-all ${
                            !isAdmin
                              ? "border-slate-100 text-slate-200 cursor-not-allowed dark:border-slate-850 dark:text-slate-800"
                              : "border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-950/30 dark:hover:bg-red-950/20"
                          }`}
                          title={!isAdmin ? "Admin status required" : "Revoke developer credential"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No developer integration credentials created for this workspace yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Developer API curls Documentation */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-lg p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Terminal className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">RESTful Automated Developer API Integration</h3>
        </div>

        {/* Endpoint 1 */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
              <span className="text-xs font-mono font-bold text-white">/api/v1/links</span>
            </div>
            <button
              onClick={() => handleCopyCurl(curlCreateString, "create")}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold"
            >
              {copiedCurl === "create" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCurl === "create" ? "Copied" : "Copy curl"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Provision dynamic redirection targets programmatically with custom split allocations.
          </p>
          <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-slate-300 border border-slate-800/80 overflow-x-auto leading-relaxed">
            {curlCreateString}
          </pre>
        </div>

        {/* Endpoint 2 */}
        <div className="space-y-2.5 border-t border-slate-800/60 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded font-mono">GET</span>
              <span className="text-xs font-mono font-bold text-white">/api/v1/links/:id/stats</span>
            </div>
            <button
              onClick={() => handleCopyCurl(curlStatsString, "stats")}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold"
            >
              {copiedCurl === "stats" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCurl === "stats" ? "Copied" : "Copy curl"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Retrieve aggregated geolocation, device distributions, browser variables, and total metrics counts.
          </p>
          <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-slate-300 border border-slate-800/80 overflow-x-auto leading-relaxed">
            {curlStatsString}
          </pre>
        </div>
      </div>
    </div>
  );
}
