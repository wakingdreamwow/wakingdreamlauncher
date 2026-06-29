/**
 * Wakingdream Launcher API client
 * Talks to https://wakingdream.cc/api/launcher/* (FCMS HMVC module `launcher`).
 */

const API_BASE = 'https://wakingdream.cc/api/launcher';

export interface NewsItem {
  id: number | string;
  title: string;
  description: string;
  created_at: string;
  status?: string;
  category?: string;
}

export interface BossEvent {
  eventEntry: number | string;
  description: string;
  length: number | string;
  start_time: string;
}

export interface ServerStatusPayload {
  server_online: boolean;
  realm_name?: string | null;
  players_online: number;
  active_world_bosses: BossEvent[];
  next_reroll?: string;
}

export interface ManifestPayload {
  version: string;
  generated_at: string;
  min_client_build: number;
  realm_address: string;
  realm_port: number;
  patches: { name: string; url: string; sha256?: string }[];
  patch_notes_url: string;
}

export interface RegisterResult {
  ok: boolean;
  error?: string;
  todo?: string;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  manifest: () => getJson<ManifestPayload>('/manifest'),
  status: () => getJson<ServerStatusPayload>('/status'),
  news: () => getJson<{ items: NewsItem[] }>('/news'),
  register: (body: { username: string; password: string; email: string }) =>
    getJson<RegisterResult>('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};
