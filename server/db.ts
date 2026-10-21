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

  const existing = db.prepare('SELECT id FROM cms_snapshot WHERE id = ?').get('live');
  if (!existing) {
    db.prepare('INSERT INTO cms_snapshot (id, payload, updated_at) VALUES (?, ?, ?)').run(
      'live',
      JSON.stringify(DEFAULT_CMS_DATA),
      new Date().toISOString()
    );
  }
}

export function getFullCMSData(): SiteCMSData {
  const row = db
    .prepare('SELECT payload FROM cms_snapshot WHERE id = ?')
    .get('live') as { payload: string } | undefined;
  if (!row) return DEFAULT_CMS_DATA;
  return JSON.parse(row.payload) as SiteCMSData;
}

export function saveFullCMSData(data: SiteCMSData): SiteCMSData {
  db.prepare(
    'INSERT INTO cms_snapshot (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at'
  ).run('live', JSON.stringify(data), new Date().toISOString());
  return data;
}
