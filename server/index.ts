import express, { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  AUTHORIZED_OWNER_EMAILS,
  getCMSData,
  hashPassword,
  initializeDatabase,
  readStore,
  saveCMSData,
  verifyPassword,
  writeStore,
} from './db';
import { DEFAULT_CMS_DATA } from '../src/data/defaultSeed';
import {
  InquiryItem,
  InquiryStatus,
  ProjectItem,
  ServiceItem,
  SiteCMSData,
  UserProfile,
} from '../src/types/cms';

initializeDatabase();

const app = express();
app.use(express.json({ limit: '5mb' }));

interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  sessionToken?: string;
}

function resolveSessionUser(req: AuthenticatedRequest): UserProfile | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  const token = authHeader.slice(7).trim();
  if (!token) return undefined;

  const store = readStore();
  const sess = store.sessions.find((s) => s.token === token);
  if (!sess) return undefined;

  if (new Date(sess.expiresAt).getTime() < Date.now()) {
    store.sessions = store.sessions.filter((s) => s.token !== token);
    writeStore(store);
    return undefined;
  }

  const found = store.users.find((u) => u.id === sess.userId);
  if (!found) return undefined;

  req.sessionToken = token;
  const effectiveRole = AUTHORIZED_OWNER_EMAILS.includes(found.email.toLowerCase())
    ? 'owner'
    : found.role;

  return {
    id: found.id,
    username: found.username,
    email: found.email,
    displayName: found.displayName,
    company: found.company,
    authProvider: 'credentials',
    role: effectiveRole,
    createdAt: found.createdAt,
  };
}

function attachUser(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  req.user = resolveSessionUser(req);
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = resolveSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  req.user = user;
  next();
}

app.use(attachUser);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    platform: 'SwiftStack (SS) Agency & Shopping Platform V5',
    owner: 'Muhammad Sarib Randhawa',
    ownerEmails: AUTHORIZED_OWNER_EMAILS,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body as {
    identifier?: string;
    password?: string;
  };

  if (!identifier || !password) {
    res.status(400).json({ error: 'Please provide both username/email and password.' });
    return;
  }

  const normalized = identifier.trim().toLowerCase();
  const store = readStore();
  const found = store.users.find(
    (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
  );

  if (!found || !verifyPassword(password, found.passwordHash)) {
    res.status(401).json({ error: 'Invalid credentials. Please verify your login and password.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);
  store.sessions.push({
    token,
    userId: found.id,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  });
  writeStore(store);

  res.json({
    token,
    user: {
      id: found.id,
      username: found.username,
      email: found.email,
      displayName: found.displayName,
      company: found.company,
      authProvider: 'credentials',
      role: AUTHORIZED_OWNER_EMAILS.includes(found.email.toLowerCase()) ? 'owner' : found.role,
      createdAt: found.createdAt,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { displayName, email, password, company } = req.body as {
    displayName?: string;
    email?: string;
    password?: string;
    company?: string;
  };

  if (!displayName || !email || !password) {
    res.status(400).json({ error: 'Full name, email address, and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    return;
  }

  const baseUsername =
    normalizedEmail
      .split('@')[0]
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20) || 'client';
  const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
  const id = crypto.randomUUID();
  const now = new Date();
  const assignedRole = AUTHORIZED_OWNER_EMAILS.includes(normalizedEmail) ? 'owner' : 'client';

  store.users.push({
    id,
    username: uniqueUsername,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    displayName: displayName.trim(),
    company: (company || '').trim(),
    role: assignedRole,
    createdAt: now.toISOString(),
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);
  store.sessions.push({
    token,
    userId: id,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  });
  writeStore(store);

  res.status(201).json({
    token,
    user: {
      id,
      username: uniqueUsername,
      email: normalizedEmail,
      displayName: displayName.trim(),
      company: (company || '').trim(),
      authProvider: 'credentials',
      role: assignedRole,
      createdAt: now.toISOString(),
    },
  });
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  if (req.sessionToken) {
    const store = readStore();
    store.sessions = store.sessions.filter((s) => s.token !== req.sessionToken);
    writeStore(store);
  }
  res.json({ ok: true });
});

// CMS Routes
app.get('/api/cms', (_req, res) => {
  res.json(getCMSData());
});

app.put('/api/cms/sync', (req, res) => {
  const body = req.body as Partial<SiteCMSData>;
  const current = getCMSData();
  const merged = saveCMSData({
    branding: { ...current.branding, ...(body.branding || {}) },
    hero: { ...current.hero, ...(body.hero || {}) },
    voice: { ...current.voice, ...(body.voice || {}) },
    theme: { ...current.theme, ...(body.theme || {}) },
    services: Array.isArray(body.services) ? body.services : current.services,
    projects: Array.isArray(body.projects) ? body.projects : current.projects,
    subAdmins: Array.isArray(body.subAdmins) ? body.subAdmins : current.subAdmins,
  });
  res.json(merged);
});

app.put('/api/cms/branding', (req, res) => {
  const cms = getCMSData();
  cms.branding = { ...cms.branding, ...req.body };
  saveCMSData(cms);
  res.json({ branding: cms.branding });
});

app.put('/api/cms/hero', (req, res) => {
  const cms = getCMSData();
  cms.hero = { ...cms.hero, ...req.body };
  saveCMSData(cms);
  res.json({ hero: cms.hero });
});

app.put('/api/cms/voice', (req, res) => {
  const cms = getCMSData();
  cms.voice = { ...cms.voice, ...req.body };
  saveCMSData(cms);
  res.json({ voice: cms.voice });
});

app.put('/api/cms/theme', (req, res) => {
  const cms = getCMSData();
  cms.theme = { ...cms.theme, ...req.body };
  saveCMSData(cms);
  res.json({ theme: cms.theme });
});

app.post('/api/cms/reset', (_req, res) => {
  const fresh = saveCMSData(structuredClone(DEFAULT_CMS_DATA));
  res.json(fresh);
});

// Services CRUD
app.post('/api/services', (req, res) => {
  const cms = getCMSData();
  const body = req.body as Partial<ServiceItem>;
  const basePriceUsd =
    typeof body.basePriceUsd === 'number'
      ? body.basePriceUsd
      : Number(String(body.priceLabel || '1000').replace(/[^0-9.]/g, '')) || 1000;

  const newService: ServiceItem = {
    id: `srv-${crypto.randomUUID().slice(0, 8)}`,
    title: (body.title || 'New Digital Service').trim(),
    category: (body.category || 'Engineering').trim(),
    shortDescription: (body.shortDescription || '').trim(),
    deliverables: Array.isArray(body.deliverables) ? body.deliverables : [],
    priceLabel: (body.priceLabel || `$${basePriceUsd.toLocaleString()}`).trim(),
    basePriceUsd,
    turnaround: (body.turnaround || '1 – 2 Weeks').trim(),
    iconName: body.iconName || 'Sparkles',
    accentHex: body.accentHex || '#22d3ee',
    featured: Boolean(body.featured),
  };

  cms.services = [...cms.services, newService];
  saveCMSData(cms);
  res.status(201).json({ service: newService });
});

app.put('/api/services/:id', (req, res) => {
  const cms = getCMSData();
  const idx = cms.services.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Service not found.' });
    return;
  }
  const updated: ServiceItem = {
    ...cms.services[idx],
    ...req.body,
    id: req.params.id,
  };
  cms.services[idx] = updated;
  saveCMSData(cms);
  res.json({ service: updated });
});

app.delete('/api/services/:id', (req, res) => {
  const cms = getCMSData();
  cms.services = cms.services.filter((s) => s.id !== req.params.id);
  saveCMSData(cms);
  res.json({ deleted: req.params.id });
});

// Projects CRUD
app.post('/api/projects', (req, res) => {
  const cms = getCMSData();
  const body = req.body as Partial<ProjectItem>;

  const newProject: ProjectItem = {
    id: `proj-${crypto.randomUUID().slice(0, 8)}`,
    title: (body.title || 'Untitled Project').trim(),
    subtitle: (body.subtitle || 'Custom Digital Solution').trim(),
    category: (body.category || 'Web & Full-Stack').trim(),
    description: (body.description || '').trim(),
    imageUrl: (body.imageUrl || './images/project-3d-commerce.jpg').trim(),
    tags: Array.isArray(body.tags) ? body.tags : [],
    metricLabel: (body.metricLabel || 'Impact').trim(),
    metricValue: (body.metricValue || '100% Custom').trim(),
    clientName: (body.clientName || 'SwiftStack Partner').trim(),
    year: (body.year || '2026').trim(),
    liveUrl: (body.liveUrl || '#order').trim(),
    featured: body.featured !== undefined ? Boolean(body.featured) : true,
  };

  cms.projects = [...cms.projects, newProject];
  saveCMSData(cms);
  res.status(201).json({ project: newProject });
});

app.put('/api/projects/:id', (req, res) => {
  const cms = getCMSData();
  const idx = cms.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  const updated: ProjectItem = {
    ...cms.projects[idx],
    ...req.body,
    id: req.params.id,
  };
  cms.projects[idx] = updated;
  saveCMSData(cms);
  res.json({ project: updated });
});

app.delete('/api/projects/:id', (req, res) => {
  const cms = getCMSData();
  cms.projects = cms.projects.filter((p) => p.id !== req.params.id);
  saveCMSData(cms);
  res.json({ deleted: req.params.id });
});

// Inquiries & Shopping Orders
app.post('/api/inquiries', (req: AuthenticatedRequest, res) => {
  const { clientName, clientEmail, companyName, serviceTitle, budgetRange, timeline, projectDetails } =
    req.body as Record<string, string>;

  if (!clientName || !clientEmail || !serviceTitle || !projectDetails) {
    res.status(400).json({ error: 'Please complete your name, email, service, and project details.' });
    return;
  }

  const now = new Date().toISOString();
  const created: InquiryItem = {
    id: `inq-${crypto.randomUUID().slice(0, 8)}`,
    clientId: req.user ? req.user.id : null,
    clientName: clientName.trim(),
    clientEmail: clientEmail.trim().toLowerCase(),
    companyName: (companyName || '').trim(),
    serviceTitle: serviceTitle.trim(),
    budgetRange: (budgetRange || 'Flexible').trim(),
    timeline: (timeline || '2 – 4 Weeks').trim(),
    projectDetails: projectDetails.trim(),
    status: 'new',
    quotedAmount: '',
    adminResponse: '',
    createdAt: now,
    updatedAt: now,
  };

  const store = readStore();
  store.inquiries = [created, ...store.inquiries];
  writeStore(store);

  res.status(201).json({ inquiry: created });
});

app.get('/api/inquiries', requireAuth, (_req: AuthenticatedRequest, res) => {
  res.json({ inquiries: readStore().inquiries });
});

app.patch('/api/inquiries/:id', (req, res) => {
  const store = readStore();
  const idx = store.inquiries.findIndex((i) => i.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Inquiry not found.' });
    return;
  }

  const { status, quotedAmount, adminResponse } = req.body as {
    status?: InquiryStatus;
    quotedAmount?: string;
    adminResponse?: string;
  };

  store.inquiries[idx] = {
    ...store.inquiries[idx],
    status: status || store.inquiries[idx].status,
    quotedAmount:
      quotedAmount !== undefined ? quotedAmount : store.inquiries[idx].quotedAmount,
    adminResponse:
      adminResponse !== undefined ? adminResponse : store.inquiries[idx].adminResponse,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);

  res.json({ inquiry: store.inquiries[idx] });
});

app.delete('/api/inquiries/:id', (req, res) => {
  const store = readStore();
  store.inquiries = store.inquiries.filter((i) => i.id !== req.params.id);
  writeStore(store);
  res.json({ deleted: req.params.id });
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.resolve(process.cwd(), 'docs');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    const appHtmlPath = path.resolve(process.cwd(), 'app.html');
    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        next();
        return;
      }
      try {
        const rawHtml = fs.readFileSync(appHtmlPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
      } catch (err) {
        next(err);
      }
    });
  }

  app.listen(port, host, () => {
    console.log(
      `[SwiftStack V5] Live platform running on http://${host}:${port} (Pure Sheesha Glass Edition)`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start SwiftStack server:', err);
  process.exit(1);
});
