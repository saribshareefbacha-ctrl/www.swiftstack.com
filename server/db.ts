import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from '../src/data/defaultSeed';
import {
  AvatarConfig,
  HeroCMS,
  InquiryItem,
  ProjectItem,
  ServiceItem,
  SiteCMSData,
  ThemeCMS,
  UserProfile,
} from '../src/types/cms';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'swiftstack.db');
export const db = new DatabaseSync(DB_PATH);

export function hashPassword(password: string, salt = 'swiftstack-salt-v1'): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cms_kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL DEFAULT 0,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL DEFAULT 0,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      auth_provider TEXT NOT NULL DEFAULT 'credentials',
      role TEXT NOT NULL DEFAULT 'client',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      client_email TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();

  // Seed KV sections if missing
  const upsertKv = db.prepare(`
    INSERT OR IGNORE INTO cms_kv (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  upsertKv.run('hero', JSON.stringify(DEFAULT_CMS_DATA.hero), now);
  upsertKv.run('theme', JSON.stringify(DEFAULT_CMS_DATA.theme), now);
  upsertKv.run('avatar', JSON.stringify(DEFAULT_CMS_DATA.avatar), now);

  // Seed default services if empty
  const srvCount = db.prepare('SELECT COUNT(*) as c FROM services').get() as { c: number };
  if (srvCount.c === 0) {
    const insertSrv = db.prepare(
      'INSERT INTO services (id, sort_order, payload, updated_at) VALUES (?, ?, ?, ?)'
    );
    DEFAULT_CMS_DATA.services.forEach((srv, idx) => {
      insertSrv.run(srv.id, idx, JSON.stringify(srv), now);
    });
  }

  // Seed default projects if empty
  const projCount = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (projCount.c === 0) {
    const insertProj = db.prepare(
      'INSERT INTO projects (id, sort_order, payload, updated_at) VALUES (?, ?, ?, ?)'
    );
    DEFAULT_CMS_DATA.projects.forEach((proj, idx) => {
      insertProj.run(proj.id, idx, JSON.stringify(proj), now);
    });
  }

  // Always guarantee hidden Owner account ('admin' / 'admin') + demo client exist
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, company, avatar_url, auth_provider, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'user-owner-admin',
    'admin',
    'sarib@swiftstack.com',
    hashPassword('admin'),
    'Muhammad Sarib Randhawa',
    'SwiftStack (SS)',
    './images/scan-sample-sarib.jpg',
    'credentials',
    'owner',
    now
  );

  insertUser.run(
    'user-client-demo',
    'zainab',
    'zainab@lumina-tech.io',
    hashPassword('client123'),
    'Zainab Malik',
    'Lumina Tech Labs',
    '',
    'google',
    'client',
    now
  );

  // Seed sample inquiries if empty
  const inqCount = db.prepare('SELECT COUNT(*) as c FROM inquiries').get() as { c: number };
  if (inqCount.c === 0) {
    const insertInq = db.prepare(
      'INSERT INTO inquiries (id, client_id, client_email, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    INITIAL_SAMPLE_INQUIRIES.forEach((inq) => {
      insertInq.run(
        inq.id,
        inq.clientId ?? null,
        inq.clientEmail.toLowerCase(),
        JSON.stringify(inq),
        inq.createdAt,
        inq.updatedAt
      );
    });
  }
}

export function getFullCMSData(): SiteCMSData {
  const getKv = db.prepare('SELECT value FROM cms_kv WHERE key = ?');
  const heroRow = getKv.get('hero') as { value: string } | undefined;
  const themeRow = getKv.get('theme') as { value: string } | undefined;
  const avatarRow = getKv.get('avatar') as { value: string } | undefined;

  const srvRows = db
    .prepare('SELECT payload FROM services ORDER BY sort_order ASC, updated_at ASC')
    .all() as { payload: string }[];
  const projRows = db
    .prepare('SELECT payload FROM projects ORDER BY sort_order ASC, updated_at ASC')
    .all() as { payload: string }[];

  return {
    hero: heroRow ? (JSON.parse(heroRow.value) as HeroCMS) : DEFAULT_CMS_DATA.hero,
    theme: themeRow ? (JSON.parse(themeRow.value) as ThemeCMS) : DEFAULT_CMS_DATA.theme,
    avatar: avatarRow ? (JSON.parse(avatarRow.value) as AvatarConfig) : DEFAULT_CMS_DATA.avatar,
    services: srvRows.map((r) => JSON.parse(r.payload) as ServiceItem),
    projects: projRows.map((r) => JSON.parse(r.payload) as ProjectItem),
  };
}

export function setKvSection<T>(key: 'hero' | 'theme' | 'avatar', data: T): T {
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO cms_kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  ).run(key, JSON.stringify(data), now);
  return data;
}

export function resetAllCMS(): SiteCMSData {
  const now = new Date().toISOString();
  setKvSection('hero', DEFAULT_CMS_DATA.hero);
  setKvSection('theme', DEFAULT_CMS_DATA.theme);
  setKvSection('avatar', DEFAULT_CMS_DATA.avatar);

  db.exec('DELETE FROM services; DELETE FROM projects;');
  const insertSrv = db.prepare(
    'INSERT INTO services (id, sort_order, payload, updated_at) VALUES (?, ?, ?, ?)'
  );
  DEFAULT_CMS_DATA.services.forEach((srv, idx) => {
    insertSrv.run(srv.id, idx, JSON.stringify(srv), now);
  });

  const insertProj = db.prepare(
    'INSERT INTO projects (id, sort_order, payload, updated_at) VALUES (?, ?, ?, ?)'
  );
  DEFAULT_CMS_DATA.projects.forEach((proj, idx) => {
    insertProj.run(proj.id, idx, JSON.stringify(proj), now);
  });

  return getFullCMSData();
}

export function mapUserRowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    displayName: String(row.display_name),
    company: String(row.company || ''),
    avatarUrl: String(row.avatar_url || ''),
    authProvider: (row.auth_provider as 'credentials' | 'google') || 'credentials',
    role: row.role === 'owner' ? 'owner' : 'client',
    createdAt: String(row.created_at),
  };
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    new Date().toISOString()
  );
  return token;
}

export function getUserByToken(token: string | undefined): UserProfile | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapUserRowToProfile(row);
}

export function getAllInquiries(): InquiryItem[] {
  const rows = db
    .prepare('SELECT payload FROM inquiries ORDER BY created_at DESC')
    .all() as { payload: string }[];
  return rows.map((r) => JSON.parse(r.payload) as InquiryItem);
}
