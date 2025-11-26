const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(ADMIN_TOKEN ? { "X-Admin-Token": ADMIN_TOKEN } : {}),
    ...init.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export interface AlertDoc {
  _id: string;
  detected_at: string;
  src_ip: string;
  score: number;
  attack: boolean;
  attack_type?: string;
  threshold?: number;
  model_prediction?: number;
}

export interface BlockDoc {
  _id: string;
  ip: string;
  blocked_at: string;
  unblock_at?: string;
  duration_sec?: number;
  reason?: string;
  actor?: string;
  note?: string;
}

export interface ConfigDoc {
  threshold: number;
  block_duration_sec: number;
  blocking_enabled?: boolean;
}

export interface DetectPreview {
  alert: boolean;
  score: number;
  threshold: number;
  note?: string;
}

export function fetchAlerts(limit = 20) {
  return request<AlertDoc[]>(`/alerts/recent?limit=${limit}`);
}

export function fetchBlocked(limit = 50) {
  return request<BlockDoc[]>(`/blocked?limit=${limit}`);
}

export function fetchBlockedHistory(limit = 5000) {
  return request<BlockDoc[]>(`/blocked/history?limit=${limit}`);
}

export function fetchConfig() {
  return request<ConfigDoc>(`/admin/config`);
}

export function updateConfig(payload: Partial<ConfigDoc>) {
  return request<{ ok: boolean; config: ConfigDoc }>(`/admin/config`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function manualBlock(ip: string, duration_sec?: number, note?: string) {
  return request<{ ok: boolean }>(`/admin/block`, {
    method: "POST",
    body: JSON.stringify({ ip, duration_sec, note }),
  });
}

export function manualUnblock(ip: string) {
  return request<{ ok: boolean }>(`/admin/block/${encodeURIComponent(ip)}`, {
    method: "DELETE",
  });
}

export function addWhitelist(ip: string, note?: string) {
  return request<{ ok: boolean }>(`/whitelist/add`, {
    method: "POST",
    body: JSON.stringify({ ip, note })
  });
}

export function removeWhitelist(ip: string) {
  return request<{ ok: boolean }>(`/whitelist/${encodeURIComponent(ip)}`, {
    method: "DELETE",
  });
}

export function fetchWhitelist(limit = 100) {
  return request<Array<{ _id?: string; ip: string; note?: string; created_at?: string }>>(`/whitelist?limit=${limit}`);
}

export function detectFlow(payload: Record<string, unknown>) {
  return request<DetectPreview>("/detect", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface SystemStatus {
  status: string;
  timestamp: string;
  live_capture_active: boolean;
  flows_last_10s: number;
  flows_last_minute: number;
  model_loaded: boolean;
  db_connected: boolean;
}

export function fetchStatus() {
  return request<SystemStatus>("/status");
}
