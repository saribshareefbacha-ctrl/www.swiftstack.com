import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_CMS_DATA } from '../src/data/defaultSeed';
import { SiteCMSData } from '../src/types/cms';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'swiftstack.db');
export const db = new DatabaseSync(DB_PATH);

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cms_snapshot (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const existing = db.prepare('SELECT id FROM cms_snapshot WHERE id = ?').get('live_v4');
  if (!existing) {
    db.prepare('INSERT INTO cms_snapshot (id, payload, updated_at) VALUES (?, ?, ?)').run(
      'live_v4',
      JSON.stringify(DEFAULT_CMS_DATA),
      new Date().toISOString()
    );
  }
}

export function getFullCMSData(): SiteCMSData {
  const row = db
    .prepare('SELECT payload FROM cms_snapshot WHERE id = ?')
    .get('live_v4') as { payload: string } | undefined;
  if (!row) return DEFAULT_CMS_DATA;
  const parsed = JSON.parse(row.payload) as Partial<SiteCMSData>;
  return {
    branding: { ...DEFAULT_CMS_DATA.branding, ...(parsed.branding || {}) },
    hero: { ...DEFAULT_CMS_DATA.hero, ...(parsed.hero || {}) },
    voice: { ...DEFAULT_CMS_DATA.voice, ...(parsed.voice || {}) },
    theme: { ...DEFAULT_CMS_DATA.theme, ...(parsed.theme || {}) },
    services:
      Array.isArray(parsed.services) && parsed.services.length > 0
        ? parsed.services
        : DEFAULT_CMS_DATA.services,
    projects:
      Array.isArray(parsed.projects) && parsed.projects.length > 0
        ? parsed.projects
        : DEFAULT_CMS_DATA.projects,
    subAdmins: Array.isArray(parsed.subAdmins) ? parsed.subAdmins : DEFAULT_CMS_DATA.subAdmins,
  };
}

export function saveFullCMSData(data: SiteCMSData): SiteCMSData {
  db.prepare(
    'INSERT INTO cms_snapshot (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at'
  ).run('live_v4', JSON.stringify(data), new Date().toISOString());
  return data;
}
