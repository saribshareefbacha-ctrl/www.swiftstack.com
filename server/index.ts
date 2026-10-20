import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import express, { Request, Response, NextFunction } from 'express';
import {
  createSession,
  db,
  getAllInquiries,
  getFullCMSData,
  getUserByToken,
  hashPassword,
  initializeDatabase,
  mapUserRowToProfile,
  resetAllCMS,
  setKvSection,
} from './db';
import { InquiryItem, ProjectItem, ServiceItem, UserProfile } from '../src/types/cms';

initializeDatabase();

interface AuthedRequest extends Request {
  user?: UserProfile | null;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    req.user = getUserByToken(token);
  } else {
    req.user = null;
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

function requireOwner(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    res.status(403).json({ error: 'Owner authorization required.' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(attachUser);

  // Health & Public CMS State
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, platform: 'SwiftStack (SS)', founder: 'Muhammad Sarib Randhawa' });
  });

  app.get('/api/cms', (_req, res) => {
    res.json(getFullCMSData());
  });

  // Owner CMS Section Updates
  app.put('/api/cms/hero', requireOwner, (req, res) => {
    const updated = setKvSection('hero', req.body);
    res.json({ hero: updated });
  });

  app.put('/api/cms/theme', requireOwner, (req, res) => {
    const updated = setKvSection('theme', req.body);
    res.json({ theme: updated });
  });

  app.put('/api/cms/avatar', requireOwner, (req, res) => {
    const updated = setKvSection('avatar', req.body);
    res.json({ avatar: updated });
  });

  app.post('/api/cms/reset', requireOwner, (_req, res) => {
    const fresh = resetAllCMS();
    res.json(fresh);
  });

  // Services CRUD
  app.post('/api/cms/services', requireOwner, (req, res) => {
    const now = new Date().toISOString();
    const maxRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM services').get() as {
      m: number;
    };
    const item: ServiceItem = {
      id: req.body.id || `srv-${crypto.randomUUID().slice(0, 8)}`,
      title: String(req.body.title || 'New SwiftStack Service'),
      category: String(req.body.category || 'Engineering'),
      shortDescription: String(req.body.shortDescription || ''),
      deliverables: Array.isArray(req.body.deliverables) ? req.body.deliverables : [],
      priceLabel: String(req.body.priceLabel || 'Custom Quote'),
      turnaround: String(req.body.turnaround || '1 – 2 Weeks'),
      iconName: String(req.body.iconName || 'Sparkles'),
      accentHex: String(req.body.accentHex || '#06b6d4'),
      featured: Boolean(req.body.featured),
    };
    db.prepare('INSERT INTO services (id, sort_order, payload, updated_at) VALUES (?, ?, ?, ?)').run(
      item.id,
      maxRow.m + 1,
      JSON.stringify(item),
      now
    );
    res.status(201).json({ service: item });
  });

  app.put('/api/cms/services/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT payload FROM services WHERE id = ?').get(id) as
      | { payload: string }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }
    const prev = JSON.parse(existing.payload) as ServiceItem;
    const updated: ServiceItem = {
      ...prev,
      ...req.body,
      id,
      deliverables: Array.isArray(req.body.deliverables)
        ? req.body.deliverables
        : prev.deliverables,
    };
    db.prepare('UPDATE services SET payload = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(updated),
      new Date().toISOString(),
      id
    );
    res.json({ service: updated });
  });

  app.delete('/api/cms/services/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
    res.json({ deleted: id });
  });

  // Projects CRUD
  app.post('/api/cms/projects', requireOwner, (req, res) => {
    const now = new Date().toISOString();
    const maxRow = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM projects').get() as {
      m: number;
    };
    const item: ProjectItem = {
      id: req.body.id || `proj-${crypto.randomUUID().slice(0, 8)}`,
      title: String(req.body.title || 'Untitled Showcase Project'),
      subtitle: String(req.body.subtitle || 'Custom Digital Solution'),
      category: String(req.body.category || '3D Web & Full-Stack'),
      description: String(req.body.description || ''),
      imageUrl: String(req.body.imageUrl || './images/project-3d-commerce.jpg'),
      tags: Array.isArray(req.body.tags) ? req.body.tags : ['React', 'Three.js'],
      metricLabel: String(req.body.metricLabel || 'Impact'),
      metricValue: String(req.body.metricValue || '100% Custom'),
      clientName: String(req.body.clientName || 'SwiftStack Partner'),
      year: String(req.body.year || '2026'),
      liveUrl: String(req.body.liveUrl || '#contact'),
      featured: req.body.featured !== undefined ? Boolean(req.body.featured) : true,
    };
    db.prepare('INSERT INTO projects (id, sort_order, payload, updated_at) VALUES (?, ?, ?, ?)').run(
      item.id,
      maxRow.m + 1,
      JSON.stringify(item),
      now
    );
    res.status(201).json({ project: item });
  });

  app.put('/api/cms/projects/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT payload FROM projects WHERE id = ?').get(id) as
      | { payload: string }
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const prev = JSON.parse(existing.payload) as ProjectItem;
    const updated: ProjectItem = {
      ...prev,
      ...req.body,
      id,
      tags: Array.isArray(req.body.tags) ? req.body.tags : prev.tags,
    };
    db.prepare('UPDATE projects SET payload = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(updated),
      new Date().toISOString(),
      id
    );
    res.json({ project: updated });
  });

  app.delete('/api/cms/projects/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ deleted: id });
  });

  // Unified Auth System
  app.post('/api/auth/login', (req, res) => {
    const identifier = String(req.body.identifier || req.body.username || req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please provide both username/email and password.' });
      return;
    }

    const row = db
      .prepare('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?')
      .get(identifier, identifier) as Record<string, unknown> | undefined;

    if (!row || String(row.password_hash) !== hashPassword(password)) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your login details.' });
      return;
    }

    const user = mapUserRowToProfile(row);
    const token = createSession(user.id);
    res.json({ token, user });
  });

  app.post('/api/auth/register', (req, res) => {
    const displayName = String(req.body.displayName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const company = String(req.body.company || '').trim();

    if (!displayName || !email || password.length < 4) {
      res
        .status(400)
        .json({ error: 'Please provide your name, a valid email, and a password (min 4 chars).' });
      return;
    }

    if (email === 'admin' || displayName.toLowerCase() === 'admin') {
      res.status(400).json({ error: 'This identifier is reserved.' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const baseUsername = email.split('@')[0].replace(/[^a-z0-9_]/gi, '') || 'client';
    const username = `${baseUsername}-${crypto.randomUUID().slice(0, 4)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, company, avatar_url, auth_provider, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'credentials', 'client', ?)`
    ).run(id, username, email, hashPassword(password), displayName, company, '', now);

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    const user = mapUserRowToProfile(row);
    const token = createSession(user.id);
    res.status(201).json({ token, user });
  });

  // Google OAuth Sign-In / Auto-Provision
  app.post('/api/auth/google', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const displayName = String(req.body.displayName || 'Google User').trim();
    const company = String(req.body.company || '').trim();
    const avatarUrl = String(req.body.avatarUrl || '').trim();

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid Google email required.' });
      return;
    }

    let row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      const id = `user-google-${crypto.randomUUID().slice(0, 8)}`;
      const username = `g_${email.split('@')[0].replace(/[^a-z0-9]/gi, '')}_${crypto
        .randomUUID()
        .slice(0, 4)}`;
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, username, email, password_hash, display_name, company, avatar_url, auth_provider, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'google', 'client', ?)`
      ).run(
        id,
        username,
        email,
        hashPassword(crypto.randomUUID()),
        displayName,
        company,
        avatarUrl,
        now
      );
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    }

    const user = mapUserRowToProfile(row);
    const token = createSession(user.id);
    res.json({ token, user });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    res.json({ user: req.user || null });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const displayName = String(req.body.displayName || user.displayName).trim();
    const company = String(req.body.company ?? user.company).trim();

    db.prepare('UPDATE users SET display_name = ?, company = ? WHERE id = ?').run(
      displayName,
      company,
      user.id
    );
    const updatedRow = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as Record<
      string,
      unknown
    >;
    res.json({ user: mapUserRowToProfile(updatedRow) });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(authHeader.slice(7).trim());
    }
    res.json({ ok: true });
  });

  // Inquiries & Quote Requests
  app.post('/api/inquiries', (req: AuthedRequest, res) => {
    const clientName = String(req.body.clientName || req.user?.displayName || '').trim();
    const clientEmail = String(req.body.clientEmail || req.user?.email || '')
      .trim()
      .toLowerCase();
    const projectDetails = String(req.body.projectDetails || '').trim();

    if (!clientName || !clientEmail || !projectDetails) {
      res
        .status(400)
        .json({ error: 'Please fill in your name, email address, and project details.' });
      return;
    }

    const now = new Date().toISOString();
    const inquiry: InquiryItem = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      clientId: req.user?.id || null,
      clientName,
      clientEmail,
      companyName: String(req.body.companyName || req.user?.company || '').trim(),
      serviceTitle: String(req.body.serviceTitle || 'Full-Stack Web Development & Custom Apps'),
      budgetRange: String(req.body.budgetRange || '$2,500 – $5,000'),
      timeline: String(req.body.timeline || '2 – 4 Weeks'),
      projectDetails,
      status: 'new',
      quotedAmount: '',
      adminResponse: '',
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(
      'INSERT INTO inquiries (id, client_id, client_email, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(inquiry.id, inquiry.clientId ?? null, inquiry.clientEmail, JSON.stringify(inquiry), now, now);

    res.status(201).json({ inquiry });
  });

  app.get('/api/inquiries/mine', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const rows = db
      .prepare(
        'SELECT payload FROM inquiries WHERE client_id = ? OR LOWER(client_email) = ? ORDER BY created_at DESC'
      )
      .all(user.id, user.email.toLowerCase()) as { payload: string }[];
    res.json({ inquiries: rows.map((r) => JSON.parse(r.payload) as InquiryItem) });
  });

  app.get('/api/inquiries', requireOwner, (_req, res) => {
    res.json({ inquiries: getAllInquiries() });
  });

  app.put('/api/inquiries/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    const row = db.prepare('SELECT payload FROM inquiries WHERE id = ?').get(id) as
      | { payload: string }
      | undefined;
    if (!row) {
      res.status(404).json({ error: 'Inquiry not found.' });
      return;
    }
    const prev = JSON.parse(row.payload) as InquiryItem;
    const now = new Date().toISOString();
    const updated: InquiryItem = {
      ...prev,
      ...req.body,
      id,
      updatedAt: now,
    };
    db.prepare(
      'UPDATE inquiries SET client_email = ?, payload = ?, updated_at = ? WHERE id = ?'
    ).run(updated.clientEmail.toLowerCase(), JSON.stringify(updated), now, id);
    res.json({ inquiry: updated });
  });

  app.delete('/api/inquiries/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    res.json({ deleted: id });
  });

  // Owner Client Management
  app.get('/api/clients', requireOwner, (_req, res) => {
    const rows = db
      .prepare("SELECT * FROM users WHERE role = 'client' ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    res.json({ clients: rows.map(mapUserRowToProfile) });
  });

  app.post('/api/clients', requireOwner, (req, res) => {
    const displayName = String(req.body.displayName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const company = String(req.body.company || '').trim();
    const password = String(req.body.password || 'client123');

    if (!displayName || !email) {
      res.status(400).json({ error: 'Client name and email are required.' });
      return;
    }

    const exists = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
    if (exists) {
      res.status(409).json({ error: 'Client email already registered.' });
      return;
    }

    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const username = `client_${crypto.randomUUID().slice(0, 6)}`;
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, display_name, company, avatar_url, auth_provider, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, '', 'credentials', 'client', ?)`
    ).run(id, username, email, hashPassword(password), displayName, company, now);

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<
      string,
      unknown
    >;
    res.status(201).json({ client: mapUserRowToProfile(created) });
  });

  app.delete('/api/clients/:id', requireOwner, (req, res) => {
    const id = String(req.params.id);
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'client'").run(id);
    res.json({ deleted: id });
  });

  const httpServer = http.createServer(app);
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const distPath = path.resolve(process.cwd(), 'docs');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT || 3000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SwiftStack (SS) Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SwiftStack server:', err);
  process.exit(1);
});
