// Backend API layer.
//
// Configure the backend by setting VITE_API_BASE_URL (e.g. in a .env file or the
// Vercel project env vars). When unset, the app runs in offline mode: submits
// resolve with { offline: true } and the UI falls back to the copyable
// Agent Payload / localStorage persistence.
//
// Planned integrations behind this layer:
// - SuperChart: template listing and chart data push. SuperChart also supports a
//   ?batchData= URL parameter that auto-triggers a batch CSV update on page open,
//   so pushToSuperChart can either POST to the backend or build such a URL.
// - 千问AI (Qwen): prompt-based assistance for generating/reviewing chart configs.

const API_BASE: string = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/$/, '');

export function apiConfigured(): boolean {
  return API_BASE.length > 0;
}

export interface SubmitResult {
  ok: boolean;
  offline?: boolean;
  error?: string;
}

async function post(path: string, payload: unknown): Promise<SubmitResult> {
  if (!API_BASE) return { ok: false, offline: true };
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Submit the 图表配置 payload for agent processing. */
export function submitChartConfig(payload: unknown): Promise<SubmitResult> {
  return post('/api/chart-config', payload);
}

/** Submit the 报告取数配置 payload for agent processing. */
export function submitReportConfig(payload: unknown): Promise<SubmitResult> {
  return post('/api/report-config', payload);
}

/** Future SuperChart integration: list available folders/templates. */
export async function fetchSuperChartTemplates(): Promise<unknown[] | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/superchart/templates`);
    if (!res.ok) return null;
    return (await res.json()) as unknown[];
  } catch {
    return null;
  }
}

/** Future SuperChart integration: push generated chart data (batch update). */
export function pushToSuperChart(templateId: string, payload: unknown): Promise<SubmitResult> {
  return post(`/api/superchart/templates/${encodeURIComponent(templateId)}/batch-update`, payload);
}

/** Future 千问AI integration: send a prompt, get assistant text back. */
export async function askQwen(prompt: string, context?: unknown): Promise<string | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/qwen/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text ?? null;
  } catch {
    return null;
  }
}
