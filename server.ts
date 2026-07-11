import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ShortLink, ClickRecord, Team, TeamMember, ApiKey, SystemNotification, Destination } from "./src/types";

// Active SSE client connections
let sseClients: any[] = [];

// Broadcast a notification to all connected clients
function broadcast(event: string, data: any) {
  sseClients.forEach((client) => {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// In-Memory Database Collections
let teams: Team[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Acme Marketing Team", plan_limit: 500, current_usage: 247 },
  { id: "22222222-2222-2222-2222-222222222222", name: "Bridgetech Devs", plan_limit: 1000, current_usage: 12 },
];

let members: TeamMember[] = [
  // Acme Team Members
  { id: "m1", team_id: "11111111-1111-1111-1111-111111111111", user_id: "u1", role: "Admin", name: "Sarah Jenkins", email: "sarah@acme.com" },
  { id: "m2", team_id: "11111111-1111-1111-1111-111111111111", user_id: "u2", role: "Member", name: "Alex River", email: "alex@acme.com" },
  { id: "m3", team_id: "11111111-1111-1111-1111-111111111111", user_id: "u3", role: "Viewer", name: "Jordan Smith", email: "jordan@acme.com" },
  
  // Bridgetech Team Members
  { id: "m4", team_id: "22222222-2222-2222-2222-222222222222", user_id: "u1", role: "Admin", name: "Sarah Jenkins", email: "sarah@acme.com" },
  { id: "m5", team_id: "22222222-2222-2222-2222-222222222222", user_id: "u4", role: "Member", name: "Dev Dave", email: "dave@bridgetech.com" },
];

let apiKeys: ApiKey[] = [
  { id: "k1", team_id: "11111111-1111-1111-1111-111111111111", name: "Production Marketing Key", key: "oyc_live_9a8b7c6d5e", created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), last_used: new Date(Date.now() - 3600 * 1000).toISOString() },
  { id: "k2", team_id: "22222222-2222-2222-2222-222222222222", name: "Development SDK Key", key: "oyc_dev_1f2e3d4c5b", created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
];

let links: ShortLink[] = [
  {
    id: "l1",
    slug: "winter-sale",
    title: "Winter Promo Campaign (60/40 Split)",
    destinations: [
      { url: "https://example.com/promo-variant-a", weight: 60 },
      { url: "https://example.com/promo-variant-b", weight: 40 },
    ],
    created_at: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
    created_by: "u1",
    team_id: "11111111-1111-1111-1111-111111111111",
    clicks_count: 145,
    status: "active",
  },
  {
    id: "l2",
    slug: "signup-beta",
    title: "Beta Signup Flow Direct",
    destinations: [
      { url: "https://example.com/signup-main", weight: 100 },
    ],
    created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
    created_by: "u2",
    team_id: "11111111-1111-1111-1111-111111111111",
    clicks_count: 82,
    custom_domain: "promo.acme.com",
    status: "active",
  },
  {
    id: "l3",
    slug: "v1-api-docs",
    title: "Developer API Docs v1",
    destinations: [
      { url: "https://example.com/docs/v1", weight: 50 },
      { url: "https://example.com/docs/v2-beta", weight: 50 },
    ],
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    created_by: "u1",
    team_id: "11111111-1111-1111-1111-111111111111",
    clicks_count: 20,
    status: "active",
  },
  {
    id: "l4",
    slug: "bridgetech-home",
    title: "Bridgetech Website Redirection",
    destinations: [
      { url: "https://example.com/bridgetech-home-v2", weight: 100 },
    ],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    created_by: "u1",
    team_id: "22222222-2222-2222-2222-222222222222",
    clicks_count: 12,
    status: "active",
  },
];

let clicks: ClickRecord[] = [];

let notifications: SystemNotification[] = [
  { id: "n1", team_id: "11111111-1111-1111-1111-111111111111", title: "Subscription limit warning", message: "Acme Marketing Team is currently at 49% of their 500 click tier limit.", type: "subscription", created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), read: false },
  { id: "n2", team_id: "11111111-1111-1111-1111-111111111111", title: "Role Modified", message: "Jordan Smith's role in 'Acme Marketing Team' has been set to Viewer.", type: "rbac", created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), read: true },
];

// Seed Historical Clicks for beautiful Analytics charts out of the box!
function seedClicks() {
  const referrers = ["Direct", "Google Search", "Twitter / X", "LinkedIn", "GitHub", "Facebook"];
  const devices = ["Mobile", "Desktop", "Tablet"];
  const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
  const countries = ["United States", "United Kingdom", "Germany", "Canada", "India", "Australia", "France", "Japan"];

  // l1 (winter-sale) - 145 clicks
  for (let i = 0; i < 145; i++) {
    // Distribute nicely over the last 28 days
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 28);
    const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - Math.random() * 24 * 3600 * 1000);
    
    // Weighted selection for destinations (60/40)
    const randDest = Math.random() < 0.6 ? "https://example.com/promo-variant-a" : "https://example.com/promo-variant-b";

    clicks.push({
      id: `c-l1-${i}`,
      link_id: "l1",
      timestamp: date.toISOString(),
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      device: Math.random() < 0.6 ? "Mobile" : (Math.random() < 0.8 ? "Desktop" : "Tablet"),
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      destination_used: randDest,
    });
  }

  // l2 (signup-beta) - 82 clicks
  for (let i = 0; i < 82; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.5) * 18);
    const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - Math.random() * 24 * 3600 * 1000);

    clicks.push({
      id: `c-l2-${i}`,
      link_id: "l2",
      timestamp: date.toISOString(),
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      device: Math.random() < 0.4 ? "Mobile" : (Math.random() < 0.9 ? "Desktop" : "Tablet"),
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      destination_used: "https://example.com/signup-main",
    });
  }

  // l3 (v1-api-docs) - 20 clicks
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 10);
    const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - Math.random() * 24 * 3600 * 1000);
    const randDest = Math.random() < 0.5 ? "https://example.com/docs/v1" : "https://example.com/docs/v2-beta";

    clicks.push({
      id: `c-l3-${i}`,
      link_id: "l3",
      timestamp: date.toISOString(),
      referrer: "GitHub", // developer doc referrer bias
      device: "Desktop", // devs are mostly on desktop
      browser: "Chrome",
      country: countries[Math.floor(Math.random() * countries.length)],
      destination_used: randDest,
    });
  }

  // l4 (bridgetech-home) - 12 clicks
  for (let i = 0; i < 12; i++) {
    const daysAgo = Math.floor(Math.random() * 5);
    const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - Math.random() * 24 * 3600 * 1000);

    clicks.push({
      id: `c-l4-${i}`,
      link_id: "l4",
      timestamp: date.toISOString(),
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      device: "Desktop",
      browser: "Safari",
      country: countries[Math.floor(Math.random() * countries.length)],
      destination_used: "https://example.com/bridgetech-home-v2",
    });
  }

  // Sort all clicks by timestamp ascending
  clicks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

seedClicks();

// Helper to record a click record
function recordClick(linkId: string, req: express.Request, chosenDest: string) {
  const referrers = ["Direct", "Google Search", "Twitter / X", "LinkedIn", "GitHub", "Facebook"];
  const devices = ["Mobile", "Desktop", "Tablet"];
  const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
  const countries = ["United States", "United Kingdom", "Germany", "Canada", "India", "Australia", "France", "Japan"];

  // Parse actual user agent headers
  const ua = req.headers["user-agent"] || "";
  let device = "Desktop";
  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/ipad|tablet/i.test(ua)) device = "Tablet";

  let browser = "Chrome";
  if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";

  const refererHeader = req.headers["referer"] || req.headers["referrer"] || "";
  let referrer = "Direct";
  if (refererHeader) {
    try {
      const url = new URL(refererHeader as string);
      referrer = url.hostname;
    } catch {
      referrer = refererHeader as string;
    }
  } else {
    // If running in local iFrame, random choose a referrer occasionally for variety
    referrer = referrers[Math.floor(Math.random() * referrers.length)];
  }

  // Simulate Geo Location (or look up real IP header)
  let country = countries[Math.floor(Math.random() * countries.length)];
  const cfCountry = req.headers["cf-ipcountry"] || req.headers["x-appengine-country"];
  if (cfCountry && typeof cfCountry === "string") {
    country = cfCountry;
  }

  const click: ClickRecord = {
    id: `click-${Math.random().toString(36).substr(2, 9)}`,
    link_id: linkId,
    timestamp: new Date().toISOString(),
    referrer,
    device,
    browser,
    country,
    destination_used: chosenDest,
  };

  clicks.push(click);

  // Update links clicks count
  const link = links.find((l) => l.id === linkId);
  if (link) {
    link.clicks_count++;
    
    // Update team usage
    const team = teams.find((t) => t.id === link.team_id);
    if (team) {
      team.current_usage++;
      
      // Check if team usage hit thresholds for real-time notification warnings!
      const usagePercent = (team.current_usage / team.plan_limit) * 100;
      if (usagePercent >= 95 && usagePercent < 96) {
        const warningNotif: SystemNotification = {
          id: `notif-${Math.random().toString(36).substr(2, 9)}`,
          team_id: team.id,
          title: "Tier limit critical alert",
          message: `Warning: ${team.name} is approaching its plan limit (${team.current_usage}/${team.plan_limit} clicks used).`,
          type: "subscription",
          created_at: new Date().toISOString(),
          read: false
        };
        notifications.push(warningNotif);
        broadcast("notification", warningNotif);
      }
    }

    // Broadcast click to open active clients for dynamic chart updates
    broadcast("click_recorded", {
      linkId: link.id,
      slug: link.slug,
      click,
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // SSE stream endpoint for real-time notification alerts
  app.get("/api/notifications/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const client = { id: Date.now(), res };
    sseClients.push(client);

    req.on("close", () => {
      sseClients = sseClients.filter((c) => c.id !== client.id);
    });
  });

  // ==========================================================================
  // REDIRECTION ENDPOINT (/:slug)
  // ==========================================================================
  app.get("/r/:slug", (req, res) => {
    const { slug } = req.params;
    const link = links.find((l) => l.slug === slug);

    if (!link || link.status === "paused") {
      return res.status(404).send(`
        <html>
          <head>
            <title>Link Not Active</title>
            <style>
              body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: #f1f5f9; text-align: center; }
              div { max-width: 400px; padding: 2rem; border-radius: 1rem; background: #1e293b; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              h1 { margin-top: 0; color: #ef4444; }
              a { color: #3b82f6; text-decoration: none; font-weight: 500; }
            </style>
          </head>
          <body>
            <div>
              <h1>Link Not Found or Paused</h1>
              <p>The short link <strong>"${slug}"</strong> is either inactive or does not exist.</p>
              <p><a href="/">Go to Dashboard</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // A/B Split Testing Smart Routing
    // Find the chosen destination url using weighted random choice
    const totalWeight = link.destinations.reduce((acc, d) => acc + d.weight, 0);
    let rand = Math.random() * (totalWeight || 100);
    let chosenDest = link.destinations[0]?.url || "https://example.com";

    let cumulativeWeight = 0;
    for (const dest of link.destinations) {
      cumulativeWeight += dest.weight;
      if (rand <= cumulativeWeight) {
        chosenDest = dest.url;
        break;
      }
    }

    // Capture granular analytics
    recordClick(link.id, req, chosenDest);

    // Dynamic countdown/redirection wrapper
    res.send(`
      <html>
        <head>
          <title>Redirecting...</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0b0f19; color: #94a3b8; margin: 0; }
            .container { text-align: center; max-width: 450px; padding: 3rem; background: rgba(30, 41, 59, 0.4); border-radius: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
            h2 { color: #f8fafc; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
            p { font-size: 0.95rem; line-height: 1.6; }
            .spinner { border: 3px solid rgba(59, 130, 246, 0.1); border-top: 3px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 2rem auto; }
            .destination-link { color: #3b82f6; font-family: monospace; font-size: 0.85rem; word-break: break-all; text-decoration: none; padding: 0.4rem 0.8rem; background: rgba(59, 130, 246, 0.08); border-radius: 0.5rem; display: inline-block; margin-top: 1rem; border: 1px solid rgba(59, 130, 246, 0.15); transition: all 0.2s; }
            .destination-link:hover { background: rgba(59, 130, 246, 0.15); }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = "${chosenDest}";
            }, 800);
          </script>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>Smart Routing Redirection</h2>
            <p>You are being safely redirected to your destination target. Click protection and tracking enabled by OwnYourClick.</p>
            <a class="destination-link" href="${chosenDest}">${chosenDest}</a>
          </div>
        </body>
      </html>
    `);
  });

  // ==========================================================================
  // DEVELOPER API AUTOMATIONS & BEARER TOKENS
  // ==========================================================================

  // Authentication Middleware for developer API
  const authenticateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing Bearer Token in authorization header." });
    }

    const token = authHeader.split(" ")[1];
    const keyMatch = apiKeys.find((k) => k.key === token);
    if (!keyMatch) {
      return res.status(403).json({ error: "Forbidden: Invalid developer API key." });
    }

    // Attach developer credentials
    (req as any).developerContext = {
      team_id: keyMatch.team_id,
      user_id: keyMatch.user_id,
    };

    // Update last used timestamp
    keyMatch.last_used = new Date().toISOString();
    next();
  };

  // POST /api/v1/links: Automated Link Generation
  app.post("/api/v1/links", authenticateApiKey, (req, res) => {
    const { slug, title, destinations, custom_domain } = req.body;
    const devCtx = (req as any).developerContext;

    if (!slug || !title || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: "Bad Request: Missing required fields (slug, title, destinations array)." });
    }

    // Validate slug uniqueness
    if (links.some((l) => l.slug === slug.trim().toLowerCase())) {
      return res.status(409).json({ error: `Conflict: Slug '${slug}' is already taken.` });
    }

    // Check weights
    const totalWeight = destinations.reduce((acc: number, d: any) => acc + (d.weight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ error: "Bad Request: Sum of destination weights must equal exactly 100%." });
    }

    const newLink: ShortLink = {
      id: `link-${Math.random().toString(36).substr(2, 9)}`,
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      destinations: destinations.map((d: any) => ({ url: d.url, weight: Number(d.weight) })),
      created_at: new Date().toISOString(),
      created_by: devCtx.user_id,
      team_id: devCtx.team_id,
      clicks_count: 0,
      custom_domain: custom_domain ? custom_domain.trim() : undefined,
      status: "active",
    };

    links.push(newLink);

    // Real-time Push Notification alert
    const notif: SystemNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      team_id: devCtx.team_id,
      title: "API Link Automated Creation",
      message: `A new short link /r/${newLink.slug} was successfully provisioned via Developer API automation.`,
      type: "metrics",
      created_at: new Date().toISOString(),
      read: false,
    };
    notifications.push(notif);
    broadcast("notification", notif);

    res.status(201).json(newLink);
  });

  // GET /api/v1/links/:id/stats: Fetch Link Click Analytics
  app.get("/api/v1/links/:id/stats", (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authenticateApiKey(req, res, next);
    }

    // Direct fallback for frontend UI dashboard requests
    const { id } = req.params;
    const link = links.find((l) => l.id === id);
    if (!link) {
      return res.status(404).json({ error: "Not Found: Short link with specified ID does not exist." });
    }

    (req as any).developerContext = {
      team_id: link.team_id,
      user_id: "u1",
    };
    next();
  }, (req, res) => {
    const { id } = req.params;
    const devCtx = (req as any).developerContext;

    const link = links.find((l) => l.id === id);
    if (!link) {
      return res.status(404).json({ error: "Not Found: Short link with specified ID does not exist." });
    }

    // Workspace Isolation enforcement
    if (link.team_id !== devCtx.team_id) {
      return res.status(403).json({ error: "Forbidden: You do not have permissions to access statistics for this link workspace." });
    }

    // Collate statistics
    const linkClicks = clicks.filter((c) => c.link_id === id);
    
    // Geographical countries collation
    const countryDistribution: Record<string, number> = {};
    const deviceDistribution: Record<string, number> = {};
    const browserDistribution: Record<string, number> = {};
    const destinationDistribution: Record<string, number> = {};

    linkClicks.forEach((c) => {
      countryDistribution[c.country] = (countryDistribution[c.country] || 0) + 1;
      deviceDistribution[c.device] = (deviceDistribution[c.device] || 0) + 1;
      browserDistribution[c.browser] = (browserDistribution[c.browser] || 0) + 1;
      destinationDistribution[c.destination_used] = (destinationDistribution[c.destination_used] || 0) + 1;
    });

    res.json({
      link: {
        id: link.id,
        slug: link.slug,
        title: link.title,
        status: link.status,
        created_at: link.created_at,
      },
      summary: {
        total_clicks: linkClicks.length,
        unique_visitors: new Set(linkClicks.map(c => c.referrer)).size, // proxy estimation
      },
      distributions: {
        countries: countryDistribution,
        devices: deviceDistribution,
        browsers: browserDistribution,
        destinations: destinationDistribution,
      }
    });
  });

  // ==========================================================================
  // FRONTEND APIS & WORKSPACE CONTROL
  // ==========================================================================

  // Get list of teams
  app.get("/api/teams", (req, res) => {
    res.json(teams);
  });

  // Get active workspace details (role, members, notifications)
  app.get("/api/workspace", (req, res) => {
    const teamId = (req.query.team_id as string) || "11111111-1111-1111-1111-111111111111";
    const userId = (req.query.user_id as string) || "u1"; //sarah

    const team = teams.find((t) => t.id === teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });

    const memberMatch = members.find((m) => m.team_id === teamId && m.user_id === userId);
    const role = memberMatch ? memberMatch.role : "Viewer";

    const workspaceMembers = members.filter((m) => m.team_id === teamId);
    const workspaceKeys = apiKeys.filter((k) => k.team_id === teamId);
    const workspaceNotifs = notifications.filter((n) => n.team_id === teamId);

    res.json({
      team,
      user_role: role,
      members: workspaceMembers,
      api_keys: workspaceKeys,
      notifications: workspaceNotifs,
    });
  });

  // Fetch short links for current active team workspace
  app.get("/api/links", (req, res) => {
    const teamId = req.query.team_id as string;
    if (!teamId) return res.status(400).json({ error: "Missing team_id parameter" });

    // Filter links by team (Team isolation)
    const teamLinks = links.filter((l) => l.team_id === teamId);
    res.json(teamLinks);
  });

  // Create Short Link (Requires Admin or Member permission)
  app.post("/api/links", (req, res) => {
    const { team_id, user_role, slug, title, destinations, custom_domain } = req.body;

    if (user_role === "Viewer") {
      return res.status(403).json({ error: "Viewer role does not have authorization to create links." });
    }

    if (!slug || !title || !destinations || destinations.length === 0) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (links.some((l) => l.slug === cleanSlug)) {
      return res.status(400).json({ error: "This slug is already taken. Please choose another one." });
    }

    const newLink: ShortLink = {
      id: `link-${Math.random().toString(36).substr(2, 9)}`,
      slug: cleanSlug,
      title: title.trim(),
      destinations: destinations.map((d: any) => ({ url: d.url, weight: Number(d.weight) })),
      created_at: new Date().toISOString(),
      created_by: "u1", // sarah
      team_id,
      clicks_count: 0,
      custom_domain: custom_domain ? custom_domain.trim() : undefined,
      status: "active",
    };

    links.push(newLink);

    // Broadcast automated metric alert if list changed
    broadcast("link_created", newLink);

    res.status(201).json(newLink);
  });

  // Edit Link (Admin or Member only)
  app.put("/api/links/:id", (req, res) => {
    const { id } = req.params;
    const { user_role, title, destinations, custom_domain, status } = req.body;

    if (user_role === "Viewer") {
      return res.status(403).json({ error: "Viewer role is unauthorized to modify links." });
    }

    const link = links.find((l) => l.id === id);
    if (!link) return res.status(404).json({ error: "Link not found" });

    if (title) link.title = title;
    if (destinations) link.destinations = destinations.map((d: any) => ({ url: d.url, weight: Number(d.weight) }));
    if (custom_domain !== undefined) link.custom_domain = custom_domain || undefined;
    if (status) link.status = status;

    res.json(link);
  });

  // Delete Link (Admin or Member only)
  app.delete("/api/links/:id", (req, res) => {
    const { id } = req.params;
    const { user_role } = req.query;

    if (user_role === "Viewer") {
      return res.status(403).json({ error: "Viewer role is unauthorized to delete links." });
    }

    const linkIndex = links.findIndex((l) => l.id === id);
    if (linkIndex === -1) return res.status(404).json({ error: "Link not found" });

    links.splice(linkIndex, 1);
    res.json({ success: true });
  });

  // Analytics aggregate reporting with date filter
  app.get("/api/analytics", (req, res) => {
    const { team_id, range, link_id } = req.query;
    if (!team_id) return res.status(400).json({ error: "Missing team_id parameter" });

    // Filter clicks belonging to current team
    let teamClicks = clicks.filter((c) => {
      const link = links.find((l) => l.id === c.link_id);
      return link && link.team_id === team_id;
    });

    // Handle individual link filter
    if (link_id) {
      teamClicks = teamClicks.filter((c) => c.link_id === link_id);
    }

    // Filter based on range (e.g. 7 days, 30 days)
    const daysLimit = range === "7d" ? 7 : (range === "24h" ? 1 : 30);
    const cutoffDate = new Date(Date.now() - daysLimit * 24 * 3600 * 1000);

    teamClicks = teamClicks.filter((c) => new Date(c.timestamp) >= cutoffDate);

    // Calculate aggregated metrics
    const totalClicks = teamClicks.length;
    
    // Unique visitors proxy based on distinct referrers + device combos
    const uniqueSessions = new Set(teamClicks.map((c) => `${c.referrer}-${c.device}`)).size;

    // Redirection targets
    const destinations: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const browsers: Record<string, number> = {};

    teamClicks.forEach((c) => {
      destinations[c.destination_used] = (destinations[c.destination_used] || 0) + 1;
      countries[c.country] = (countries[c.country] || 0) + 1;
      devices[c.device] = (devices[c.device] || 0) + 1;
      referrers[c.referrer] = (referrers[c.referrer] || 0) + 1;
      browsers[c.browser] = (browsers[c.browser] || 0) + 1;
    });

    // Formatting distributions for recharts
    const formatData = (record: Record<string, number>) => {
      return Object.entries(record).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    };

    // Construct Trend Timeline
    const timelineMap: Record<string, number> = {};
    teamClicks.forEach((c) => {
      const dateStr = new Date(c.timestamp).toISOString().split("T")[0];
      timelineMap[dateStr] = (timelineMap[dateStr] || 0) + 1;
    });

    // Fill in dates that might be missing for visual continuity
    const timelineData = [];
    for (let i = daysLimit; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 3600 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      // Format to reader-friendly month day e.g. "Oct 12"
      const formattedLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      timelineData.push({
        date: dateStr,
        label: formattedLabel,
        clicks: timelineMap[dateStr] || 0,
      });
    }

    res.json({
      total_clicks: totalClicks,
      unique_visitors: uniqueSessions || Math.floor(totalClicks * 0.75),
      countries: formatData(countries),
      devices: formatData(devices),
      referrers: formatData(referrers).slice(0, 5),
      browsers: formatData(browsers),
      timeline: timelineData,
    });
  });

  // Admin Workspace Management: Member Role management (Admin only)
  app.post("/api/members", (req, res) => {
    const { team_id, user_role, name, email, role } = req.body;

    if (user_role !== "Admin") {
      return res.status(403).json({ error: "Only Admins can invite or manage members." });
    }

    if (!name || !email || !role) {
      return res.status(400).json({ error: "Missing name, email, or role." });
    }

    // Add new user
    const newMember: TeamMember = {
      id: `m-${Math.random().toString(36).substr(2, 9)}`,
      team_id,
      user_id: `u-${Math.random().toString(36).substr(2, 9)}`,
      role,
      name,
      email,
    };

    members.push(newMember);

    // Broadcast RBAC notification alert
    const rbacNotif: SystemNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      team_id,
      title: "Team Permissions Updated",
      message: `${name} was invited to the team with role '${role}'.`,
      type: "rbac",
      created_at: new Date().toISOString(),
      read: false,
    };
    notifications.push(rbacNotif);
    broadcast("notification", rbacNotif);

    res.status(201).json(newMember);
  });

  // Admin Workspace Management: Remove member (Admin only)
  app.delete("/api/members/:id", (req, res) => {
    const { id } = req.params;
    const { user_role } = req.query;

    if (user_role !== "Admin") {
      return res.status(403).json({ error: "Forbidden: Admin privileges required." });
    }

    const mIdx = members.findIndex((m) => m.id === id);
    if (mIdx === -1) return res.status(404).json({ error: "Member not found." });

    const removed = members[mIdx];
    members.splice(mIdx, 1);

    res.json({ success: true, removed });
  });

  // Admin Workspace Management: Generate Developer API Keys (Admin only)
  app.post("/api/keys", (req, res) => {
    const { team_id, user_role, name } = req.body;

    if (user_role !== "Admin") {
      return res.status(403).json({ error: "Forbidden: Admin authorization required to generate API Keys." });
    }

    if (!name) return res.status(400).json({ error: "API Key label is required." });

    const randString = Math.random().toString(36).substr(2, 10);
    const newKey: ApiKey = {
      id: `key-${Math.random().toString(36).substr(2, 9)}`,
      team_id,
      name,
      key: `oyc_live_${randString}`,
      created_at: new Date().toISOString(),
    };

    apiKeys.push(newKey);

    const keyNotif: SystemNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      team_id,
      title: "Developer Credentials Generated",
      message: `A new API key '${name}' was generated. Keep this credential secure.`,
      type: "rbac",
      created_at: new Date().toISOString(),
      read: false,
    };
    notifications.push(keyNotif);
    broadcast("notification", keyNotif);

    res.status(201).json(newKey);
  });

  // Admin Workspace: Revoke Developer API Keys (Admin only)
  app.delete("/api/keys/:id", (req, res) => {
    const { id } = req.params;
    const { user_role } = req.query;

    if (user_role !== "Admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    const keyIdx = apiKeys.findIndex((k) => k.id === id);
    if (keyIdx === -1) return res.status(404).json({ error: "API key not found." });

    const removed = apiKeys[keyIdx];
    apiKeys.splice(keyIdx, 1);

    res.json({ success: true, removed });
  });

  // Read notifications
  app.post("/api/notifications/read-all", (req, res) => {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ error: "Missing team_id" });

    notifications.forEach((n) => {
      if (n.team_id === team_id) n.read = true;
    });

    res.json({ success: true });
  });

  // Simulate instant traffic debug helper!
  app.post("/api/simulate-click", (req, res) => {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ error: "Missing team_id" });

    const teamLinks = links.filter((l) => l.team_id === team_id && l.status === "active");
    if (teamLinks.length === 0) {
      return res.status(400).json({ error: "No active short links available to simulate traffic. Please create a link first!" });
    }

    // Generate 15 fake clicks across random active links
    const clicksToGenerate = 15;
    for (let i = 0; i < clicksToGenerate; i++) {
      const randomLink = teamLinks[Math.floor(Math.random() * teamLinks.length)];
      const randDest = randomLink.destinations[Math.floor(Math.random() * randomLink.destinations.length)].url;
      recordClick(randomLink.id, req, randDest);
    }

    // Trigger instant toast notification alert
    const activityNotif: SystemNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      team_id,
      title: "Spike in link traffic detected",
      message: `Analytics spike: ${clicksToGenerate} new redirection events registered across your promotional campaigns.`,
      type: "metrics",
      created_at: new Date().toISOString(),
      read: false,
    };
    notifications.push(activityNotif);
    broadcast("notification", activityNotif);

    res.json({ success: true, count: clicksToGenerate });
  });


  // ==========================================================================
  // VITE BUNDLER / INDEX FALLBACK
  // ==========================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OwnYourClick Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
