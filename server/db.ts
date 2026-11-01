import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_CMS_DATA,
  DEFAULT_OFFICIAL_SOCIAL_LINKS,
  DEFAULT_REALTIME_METRICS,
  INITIAL_SAMPLE_INQUIRIES,
} from '../src/data/defaultSeed';
import { InquiryItem, SiteCMSData } from '../src/types/cms';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STORE_FILE = path.join(DATA_DIR, 'swiftstack_v6_store.json');

export const AUTHORIZED_OWNER_EMAILS = [
  'saribshareefbacha@gmail.com',
  'swiftstackdigi01@gmail.com',
  'sarib@swiftstack.com',
];

export interface StoredUserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  company: string;
  role: 'owner' | 'subadmin' | 'client';
  createdAt: string;
}

export interface StoredSessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

interface PersistentStoreSchema {
  cms: SiteCMSData;
  users: StoredUserRecord[];
  sessions: StoredSessionRecord[];
  inquiries: InquiryItem[];
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

let memoryStore: PersistentStoreSchema | null = null;

function createDefaultStore(): PersistentStoreSchema {
  const now = new Date().toISOString();
  const ownerHash = hashPassword('admin');
  return {
    cms: structuredClone(DEFAULT_CMS_DATA),
    users: [
      {
        id: 'owner-sarib-randhawa',
        username: 'admin',
        email: 'saribshareefbacha@gmail.com',
        passwordHash: ownerHash,
        displayName: 'Muhammad Sarib Randhawa',
        company: 'SwiftStack (SS)',
        role: 'owner',
        createdAt: now,
      },
      {
        id: 'owner-swiftstack-official',
        username: 'swiftstackdigi01',
        email: 'swiftstackdigi01@gmail.com',
        passwordHash: ownerHash,
        displayName: 'SwiftStack Official (Owner)',
        company: 'SwiftStack (SS)',
        role: 'owner',
        createdAt: now,
      },
      {
        id: 'client-zainab-demo',
        username: 'zainab',
        email: 'zainab@lumina-tech.io',
        passwordHash: hashPassword('client123'),
        displayName: 'Zainab Malik',
        company: 'Lumina Tech Labs',
        role: 'client',
        createdAt: now,
      },
    ],
    sessions: [],
    inquiries: structuredClone(INITIAL_SAMPLE_INQUIRIES),
  };
}

export function readStore(): PersistentStoreSchema {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(
        fs.readFileSync(STORE_FILE, 'utf-8')
      ) as Partial<PersistentStoreSchema>;
      const base = createDefaultStore();
      memoryStore = {
        cms: {
          branding: { ...base.cms.branding, ...(parsed.cms?.branding || {}) },
          hero: { ...base.cms.hero, ...(parsed.cms?.hero || {}) },
          metrics:
            Array.isArray(parsed.cms?.metrics) && parsed.cms.metrics.length > 0
              ? parsed.cms.metrics
              : structuredClone(DEFAULT_REALTIME_METRICS),
          socialLinks:
            Array.isArray(parsed.cms?.socialLinks) && parsed.cms.socialLinks.length > 0
              ? parsed.cms.socialLinks
              : structuredClone(DEFAULT_OFFICIAL_SOCIAL_LINKS),
          voice: { ...base.cms.voice, ...(parsed.cms?.voice || {}) },
          theme: { ...base.cms.theme, ...(parsed.cms?.theme || {}) },
          services: parsed.cms?.services || base.cms.services,
          projects: parsed.cms?.projects || base.cms.projects,
          subAdmins: parsed.cms?.subAdmins || base.cms.subAdmins,
        },
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : base.users,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        inquiries:
          Array.isArray(parsed.inquiries) && parsed.inquiries.length > 0
            ? parsed.inquiries
            : base.inquiries,
      };
      return memoryStore;
    }
  } catch {
    // ignore corrupt disk cache
  }
  memoryStore = createDefaultStore();
  writeStore(memoryStore);
  return memoryStore;
}

export function writeStore(next: PersistentStoreSchema): void {
  memoryStore = next;
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    // ignore read-only fs edge case
  }
}

export function initializeDatabase(): void {
  readStore();
}

export function getCMSData(): SiteCMSData {
  return readStore().cms;
}

export function saveCMSData(nextCms: SiteCMSData): SiteCMSData {
  const store = readStore();
  store.cms = nextCms;
  writeStore(store);
  return nextCms;
}
