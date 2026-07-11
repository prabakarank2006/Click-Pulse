import React, { useState } from "react";
import { 
  Link2, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  ExternalLink, 
  AlertCircle, 
  ArrowRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  BarChart4,
  MapPin,
  Laptop,
  RotateCw
} from "lucide-react";
import { ShortLink, Destination, ClickRecord } from "../types";

interface LinkManagerProps {
  activeTeamId: string;
  userRole: 'Admin' | 'Member' | 'Viewer';
  links: ShortLink[];
  onAddLink: (link: Omit<ShortLink, 'id' | 'clicks_count' | 'created_at' | 'created_by'>) => Promise<boolean>;
  onUpdateLink: (id: string, updates: Partial<ShortLink>) => Promise<boolean>;
  onDeleteLink: (id: string) => Promise<boolean>;
}

export default function LinkManager({
  activeTeamId,
  userRole,
  links,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
}: LinkManagerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCustomDomain, setNewCustomDomain] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([
    { url: "https://example.com/variant-a", weight: 60 },
    { url: "https://example.com/variant-b", weight: 40 },
  ]);

  // Expanded link states for granular reporting
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [expandedStats, setExpandedStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isViewer = userRole === "Viewer";

  const handleCopy = async (slug: string, id: string) => {
    // Generate absolute redirection target URL pointing to standard container
    const domain = window.location.origin;
    const fullUrl = `${domain}/r/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Unable to copy to clipboard:", err);
    }
  };

  const handleAddDestinationRow = () => {
    // Distribute remaining weights evenly
    const totalCurrentWeight = destinations.reduce((sum, d) => sum + d.weight, 0);
    const remaining = Math.max(0, 100 - totalCurrentWeight);
    setDestinations([...destinations, { url: "", weight: remaining }]);
  };

  const handleRemoveDestinationRow = (index: number) => {
    if (destinations.length <= 1) return;
    const updated = destinations.filter((_, i) => i !== index);
    setDestinations(updated);
  };

  const handleDestinationChange = (index: number, field: keyof Destination, value: string | number) => {
    const updated = [...destinations];
    if (field === "weight") {
      updated[index].weight = Number(value);
    } else {
      updated[index].url = String(value);
    }
    setDestinations(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isViewer) {
      setError("Viewer access limits restrict modifications.");
      return;
    }

    if (!newSlug.trim()) {
      setError("A short code slug is required.");
      return;
    }

    if (!newTitle.trim()) {
      setError("A tracking campaign title is required.");
      return;
    }

    // Validate destinations
    const invalidDest = destinations.some(d => !d.url.trim() || d.weight < 0);
    if (invalidDest) {
      setError("All destination target URLs must be filled with a non-negative weight distribution.");
      return;
    }

    // Sum validation
    const totalWeight = destinations.reduce((sum, d) => sum + d.weight, 0);
    if (totalWeight !== 100) {
      setError(`Split testing allocation weights must sum exactly to 100%. Currently they equal ${totalWeight}%.`);
      return;
    }

    const successFlag = await onAddLink({
      slug: newSlug.trim().toLowerCase(),
      title: newTitle.trim(),
      destinations,
      custom_domain: newCustomDomain.trim() || undefined,
      status: "active",
      team_id: activeTeamId,
    });

    if (successFlag) {
      setSuccess(`Short link /r/${newSlug} was successfully provisioned!`);
      // Reset form
      setNewSlug("");
      setNewTitle("");
      setNewCustomDomain("");
      setDestinations([
        { url: "https://example.com/variant-a", weight: 60 },
        { url: "https://example.com/variant-b", weight: 40 },
      ]);
      setShowCreateForm(false);
    } else {
      setError("Creating link failed. Please check if this slug is already registered in this workspace.");
    }
  };

  const toggleLinkStatus = async (link: ShortLink) => {
    if (isViewer) return;
    const newStatus = link.status === "active" ? "paused" : "active";
    await onUpdateLink(link.id, { status: newStatus });
  };

  const handleExpandLink = async (linkId: string) => {
    if (expandedLinkId === linkId) {
      setExpandedLinkId(null);
      setExpandedStats(null);
      return;
    }

    setExpandedLinkId(linkId);
    setLoadingStats(true);
    setExpandedStats(null);

    try {
      // Simulate/retrieve individual granular stats for this link
      const res = await fetch(`/api/v1/links/${linkId}/stats`);
      const data = await res.json();
      setExpandedStats(data);
    } catch (err) {
      console.error("Error retrieving individual link stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-600" /> Advanced Link Core
          </h2>
          <p className="text-xs text-slate-500 mt-1">Configure automated split-testing allocations and custom domain redirections.</p>
        </div>

        {!showCreateForm && (
          <button
            onClick={() => {
              if (isViewer) return;
              setShowCreateForm(true);
            }}
            disabled={isViewer}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md transition-all ${
              isViewer
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10 cursor-pointer"
            }`}
          >
            <Plus className="h-4 w-4" /> 
            {isViewer ? "Viewer Read-Only" : "Shorten New Link"}
          </button>
        )}
      </div>

      {/* Dynamic Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl border border-red-200/50 dark:border-red-900/40 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl border border-green-200/50 dark:border-green-900/40 text-xs flex items-center gap-2.5 animate-fadeIn">
          <Sparkles className="h-4 w-4 shrink-0 text-green-500" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Dynamic creation form */}
      {showCreateForm && (
        <form onSubmit={handleCreateSubmit} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Campaign Shortening Wizard</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Campaign title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Campaign Title Label</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Winter Sale Promo Campaign"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Custom URL Slug code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">Short Slug Code (e.g., /r/winter-sale)</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 focus-within:ring-1 focus-within:ring-indigo-500">
                <span className="px-3 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px] flex items-center">
                  /r/
                </span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="winter-sale"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Custom Domain */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-400 block flex items-center gap-1">
                Custom domain branding (Optional CNAME Mapping) <Info className="h-3 w-3 text-slate-400" title="Map custom subdomains e.g. promo.acme.com via DNS mapping to resolve" />
              </label>
              <input
                type="text"
                value={newCustomDomain}
                onChange={(e) => setNewCustomDomain(e.target.value)}
                placeholder="promo.acme.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Destination allocations */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>Smart Routing Split Destinations</span>
              </div>
              <button
                type="button"
                onClick={handleAddDestinationRow}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded text-indigo-600 dark:text-indigo-400"
              >
                + Add A/B Target
              </button>
            </div>

            <div className="space-y-2.5">
              {destinations.map((dest, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={dest.url}
                      onChange={(e) => handleDestinationChange(i, "url", e.target.value)}
                      placeholder="https://yourwebsite.com/destination-variant"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="w-24 flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={dest.weight}
                      onChange={(e) => handleDestinationChange(i, "weight", e.target.value)}
                      className="w-14 px-2 py-2 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-bold font-mono">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDestinationRow(i)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1.5">
              <Info className="h-3 w-3 text-slate-400" />
              Weight allocation determines what percentage of your traffic gets routed to each variant. The sum of all values must equal 100%.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Deploy Tracking Link
          </button>
        </form>
      )}

      {/* Main Links List Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Shortened Targets</span>
        </div>

        <div className="overflow-x-auto">
          {links.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-xs font-bold text-slate-400 bg-slate-50/30 dark:bg-slate-950/10">
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Short Link Address</th>
                  <th className="px-6 py-3.5">A/B Testing Destinations</th>
                  <th className="px-6 py-3.5 text-center">Analytics</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {links.map((link) => {
                  const isExpanded = expandedLinkId === link.id;
                  return (
                    <>
                      <tr key={link.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                        {/* Status Toggle */}
                        <td className="px-6 py-4 shrink-0">
                          <button
                            onClick={() => toggleLinkStatus(link)}
                            disabled={isViewer}
                            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                              link.status === "active"
                                ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                            }`}
                            title={link.status === "active" ? "Click to Pause" : "Click to Resume"}
                          >
                            {link.status === "active" ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
                          </button>
                        </td>

                        {/* Title and Short Link address */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-850 dark:text-slate-100 text-xs block">{link.title}</span>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                              <span>/r/{link.slug}</span>
                              <button
                                onClick={() => handleCopy(link.slug, link.id)}
                                className="p-0.5 hover:text-indigo-500 text-slate-400 rounded transition-colors"
                                title="Copy short url"
                              >
                                {copiedId === link.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                              <a
                                href={`/r/${link.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-indigo-500 p-0.5"
                                title="Open redirection target"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {link.custom_domain && (
                              <span className="text-[9px] font-mono font-semibold text-indigo-500 block">Domain: {link.custom_domain}</span>
                            )}
                          </div>
                        </td>

                        {/* Destinations splits list */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 max-w-sm">
                            {link.destinations.map((d, index) => (
                              <div key={index} className="flex items-center justify-between text-[11px] font-medium border-b border-slate-100 dark:border-slate-800/20 pb-0.5 last:border-0">
                                <span className="text-slate-500 truncate max-w-[180px]" title={d.url}>{d.url}</span>
                                <span className="font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded text-[10px] shrink-0">{d.weight}%</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Total click counters */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleExpandLink(link.id)}
                            className="inline-flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-950/40 dark:hover:bg-indigo-950/60 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-300 font-bold transition-all"
                          >
                            <BarChart4 className="h-3 w-3 text-indigo-500" />
                            {link.clicks_count} clicks
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (isViewer) return;
                              onDeleteLink(link.id);
                            }}
                            disabled={isViewer}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isViewer
                                ? "border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-850 dark:text-slate-700"
                                : "border-slate-100 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-950/30 dark:hover:bg-red-950/20"
                            }`}
                            title="Delete this shortened campaign link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Section for Granular Reporting */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/50 dark:bg-slate-950/20 px-6 py-5">
                            {loadingStats ? (
                              <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-500">
                                <RotateCw className="h-4 w-4 animate-spin text-indigo-500" />
                                <span>Assembling granular reporting matrices...</span>
                              </div>
                            ) : expandedStats ? (
                              <div className="space-y-4 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Overview */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campaign Performance</span>
                                    <div className="flex items-baseline gap-1.5 pt-1">
                                      <span className="text-xl font-bold text-slate-900 dark:text-white">{expandedStats.summary.total_clicks}</span>
                                      <span className="text-[11px] text-slate-500">clicks logged</span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-xl font-bold text-slate-900 dark:text-white">{expandedStats.summary.unique_visitors}</span>
                                      <span className="text-[11px] text-slate-500">unique referrers</span>
                                    </div>
                                  </div>

                                  {/* Geolocation splits */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Geo Countries
                                    </span>
                                    <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                                      {Object.entries(expandedStats.distributions.countries).map(([country, count]: any) => (
                                        <div key={country} className="flex justify-between items-center text-xs">
                                          <span className="text-slate-600 dark:text-slate-300 font-medium">{country}</span>
                                          <span className="font-mono text-slate-500 font-bold">{count}</span>
                                        </div>
                                      ))}
                                      {Object.keys(expandedStats.distributions.countries).length === 0 && (
                                        <span className="text-xs text-slate-400 italic">No geo logs.</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Devices splits */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                                      <Laptop className="h-3.5 w-3.5 text-emerald-500" /> Device Type
                                    </span>
                                    <div className="space-y-1.5">
                                      {Object.entries(expandedStats.distributions.devices).map(([device, count]: any) => (
                                        <div key={device} className="flex justify-between items-center text-xs">
                                          <span className="text-slate-600 dark:text-slate-300 font-medium">{device}</span>
                                          <span className="font-mono text-slate-500 font-bold">{count}</span>
                                        </div>
                                      ))}
                                      {Object.keys(expandedStats.distributions.devices).length === 0 && (
                                        <span className="text-xs text-slate-400 italic">No device logs.</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Destinations hits list */}
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Split Redirection variant hits</span>
                                  <div className="space-y-2">
                                    {Object.entries(expandedStats.distributions.destinations).map(([dest, count]: any) => (
                                      <div key={dest} className="flex items-center justify-between text-xs font-mono">
                                        <span className="text-slate-500 truncate max-w-[400px]">{dest}</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{count} hits</span>
                                      </div>
                                    ))}
                                    {Object.keys(expandedStats.distributions.destinations).length === 0 && (
                                      <span className="text-xs text-slate-400 italic">No redirects recorded yet.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-2 text-xs text-slate-400">Failed to load stats details.</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 space-y-2">
              <Link2 className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-500">No short links provisioned in this workspace yet.</p>
              {!isViewer && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Create your first link campaign now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
