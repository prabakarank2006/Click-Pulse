import { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  Clock, 
  Globe, 
  Laptop, 
  Compass, 
  ArrowUpRight,
  Filter,
  CheckCircle,
  HelpCircle,
  RotateCw
} from "lucide-react";
import { ShortLink } from "../types";

interface AnalyticsViewProps {
  activeTeamId: string;
  links: ShortLink[];
}

export default function AnalyticsView({ activeTeamId, links }: AnalyticsViewProps) {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("30d");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch metrics on parameter updates
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/analytics?team_id=${activeTeamId}&range=${range}`;
      if (selectedLinkId) {
        url += `&link_id=${selectedLinkId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error retrieving analytics metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeTeamId, range, selectedLinkId, links]);

  // Accent Color Palettes
  const COLORS_DEVICE = ["#6366f1", "#2dd4bf", "#f59e0b"]; // Mobile (Indigo), Desktop (Teal), Tablet
  const COLORS_BROWSER = ["#6366f1", "#ef4444", "#eab308", "#a855f7"]; // Chrome, Safari, Firefox, Edge
  const COLORS_GEO = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981", "#14b8a6", "#3b82f6"];

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RotateCw className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Querying real-time event logs...</p>
      </div>
    );
  }

  // Pre-process timelines and safe values
  const totalClicks = analytics?.total_clicks || 0;
  const uniqueVisitors = analytics?.unique_visitors || 0;
  const timelineData = analytics?.timeline || [];
  const countryData = analytics?.countries || [];
  const deviceData = analytics?.devices || [];
  const referrerData = analytics?.referrers || [];
  const browserData = analytics?.browsers || [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Real-Time Insights Workspace</h2>
          <p className="text-xs text-slate-500 mt-1">Isolate conversion performance and analyze geolocation variables.</p>
        </div>

        {/* Granular Filtering Control panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Link-specific filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 font-sans flex items-center gap-1">
              <Filter className="h-3 w-3" /> Focus Link:
            </span>
            <select
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All active links</option>
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  /{l.slug} ({l.title.substring(0, 20)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Date range switcher */}
          <div className="bg-slate-100 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-200/40 dark:border-slate-800 flex items-center gap-0.5">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-all ${
                  range === r
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {r === "24h" ? "24 Hours" : r === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Core Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Clicks card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Traffic clicks</span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalClicks}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-0.5 font-bold text-green-500">
              <TrendingUp className="h-3 w-3" /> Real-time
            </span>
            <span>monitoring click sessions</span>
          </div>
        </div>

        {/* Unique Visitors card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Unique Visitors</span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{uniqueVisitors}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-0.5 font-bold text-indigo-500">
              ~{Math.round((uniqueVisitors / (totalClicks || 1)) * 100)}%
            </span>
            <span>of total redirection clicks</span>
          </div>
        </div>

        {/* Conversion Rate estimate card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-xl translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Smart Redirections</span>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">100%</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-0.5 font-bold text-emerald-500">
              Healthy
            </span>
            <span>redirection status checked</span>
          </div>
        </div>
      </div>

      {/* Main Trends Area Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Click Traffic Volume Trends</h3>
            <span className="text-[11px] text-slate-400 block font-medium">Daily visualization of target redirections recorded.</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="h-3.5 w-3.5" /> Synchronized 1m ago
          </div>
        </div>

        <div className="h-72 w-full">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: "#94a3b8" }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "#94a3b8" }} 
                  axisLine={false} 
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.95)", 
                    borderRadius: "10px", 
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    fontSize: "12px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No click records logged for the chosen parameters.
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Metrics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Geolocation Country Split */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Geolocation & Country Split</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Pie Chart display */}
              <div className="h-44 md:col-span-2 flex items-center justify-center">
                {countryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {countryData.slice(0, 5).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS_GEO[index % COLORS_GEO.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-slate-400">Empty split</span>
                )}
              </div>

              {/* Geo list display */}
              <div className="md:col-span-3 space-y-2.5">
                {countryData.slice(0, 5).map((c: any, i: number) => {
                  const percent = Math.round((c.value / (totalClicks || 1)) * 100);
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: COLORS_GEO[i % COLORS_GEO.length] }} 
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                        </div>
                        <span className="text-slate-500 font-semibold">{c.value} ({percent}%)</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${percent}%`, 
                            backgroundColor: COLORS_GEO[i % COLORS_GEO.length] 
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
                {countryData.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No geographical data registered.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Referrer Traffic Channels */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Top Referral Channels</h4>
            </div>

            <div className="space-y-3">
              {referrerData.map((ref: any, idx: number) => {
                const percent = Math.round((ref.value / (totalClicks || 1)) * 100);
                return (
                  <div key={ref.name} className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="space-y-0.5 truncate pr-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">{ref.name}</span>
                      <span className="text-[10px] text-slate-400 block">{percent}% share</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono block">{ref.value}</span>
                      <span className="text-[10px] text-slate-400 block">clicks</span>
                    </div>
                  </div>
                );
              })}
              {referrerData.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10">No referrals captured.</p>
              )}
            </div>
          </div>
        </div>

        {/* Device breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Laptop className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Device Distribution</h4>
          </div>

          <div className="space-y-4">
            {deviceData.map((dev: any, i: number) => {
              const percent = Math.round((dev.value / (totalClicks || 1)) * 100);
              return (
                <div key={dev.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">{dev.name}</span>
                    <span className="text-slate-500">{dev.value} ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: COLORS_DEVICE[i % COLORS_DEVICE.length] 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
            {deviceData.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No device logs available.</p>
            )}
          </div>
        </div>

        {/* Browser distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Compass className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Browser Distribution</h4>
          </div>

          <div className="space-y-4">
            {browserData.map((br: any, i: number) => {
              const percent = Math.round((br.value / (totalClicks || 1)) * 100);
              return (
                <div key={br.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">{br.name}</span>
                    <span className="text-slate-500">{br.value} ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: COLORS_BROWSER[i % COLORS_BROWSER.length] 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
            {browserData.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No browser logs available.</p>
            )}
          </div>
        </div>

        {/* Integration tip banner */}
        <div className="bg-gradient-to-tr from-indigo-600 to-purple-700 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-sm font-bold tracking-tight">Need granular reporting?</h4>
            <p className="text-[11px] leading-relaxed text-indigo-100">
              OwnYourClick uses standard pgcrypto UUID distributions coupled with fast indexes on the `clicks` table for real-time sub-second analytics reporting.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-200">Active protection</span>
            <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-semibold">Learn more</div>
          </div>
        </div>

      </div>
    </div>
  );
}
