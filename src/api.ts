// Auto Report backend API layer.
//
// Configure the backend by setting VITE_API_BASE_URL (e.g. https://tej69zzg.sg-fn.tiktok-row.net
// in a .env file or the Vercel project env vars). When unset, the app runs in offline
// mode: submits resolve with { offline: true } and the UI falls back to the copyable
// Agent Payload / localStorage persistence.
//
// Resources:
// - data_templates: one 数据模板 per Template ID (business_scene, chart_template_id,
//   drill_dimensions, data_report_config[], creator/owner/type).
// - report_data_templates: one 报告 grouping a set of chart_template_ids, with
//   owner[]/allow_users[] access control (owner can include the literal "public").
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

interface ApiResult<T = unknown> extends SubmitResult {
  data?: T;
}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  if (!API_BASE) return { ok: false, offline: true };
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => null)) as (T & { message?: string; error?: string }) | null;
    if (!res.ok) {
      return { ok: false, error: (data && (data.message || data.error)) || `HTTP ${res.status}` };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ---- data_templates ----

export function createDataTemplate(payload: unknown) {
  return request('POST', '/api/auto_report/data_templates', payload);
}

export function getDataTemplate(chartTemplateId: string) {
  return request('GET', `/api/auto_report/data_templates/${encodeURIComponent(chartTemplateId)}`);
}

export function deleteDataTemplate(dataTemplateId: number) {
  return request('DELETE', `/api/auto_report/data_templates?data_template_id=${dataTemplateId}`);
}

export function listDataTemplates(params: { keyword?: string; page?: number; pageSize?: number } = {}) {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('page_size', String(params.pageSize));
  const qs = q.toString();
  return request('GET', `/api/auto_report/data_templates${qs ? `?${qs}` : ''}`);
}

// ---- report_data_templates ----

export function createReportDataTemplate(payload: unknown) {
  return request('POST', '/api/auto_report/report_data_templates', payload);
}

export function updateReportDataTemplate(reportConfigId: number, payload: unknown) {
  return request('PUT', `/api/auto_report/report_data_templates/${reportConfigId}`, {
    ...(payload as object),
    id: reportConfigId,
  });
}

export function getReportDataTemplate(reportConfigId: number) {
  return request('GET', `/api/auto_report/report_data_templates/${reportConfigId}`);
}

export function deleteReportDataTemplate(reportConfigId: number) {
  return request('DELETE', `/api/auto_report/report_data_templates?report_config_id=${reportConfigId}`);
}

export function listReportDataTemplates(
  params: { keyword?: string; page?: number; pageSize?: number; expandTemplates?: boolean } = {}
) {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('page_size', String(params.pageSize));
  if (params.expandTemplates) q.set('expand_templates', 'true');
  const qs = q.toString();
  return request('GET', `/api/auto_report/report_data_templates${qs ? `?${qs}` : ''}`);
}

// ---- Tab submit actions ----

/** Submit the 图表配置 payload: one data_template create call per Template ID card. */
export async function submitChartConfig(payload: { data_templates: unknown[] }): Promise<SubmitResult> {
  if (!API_BASE) return { ok: false, offline: true };
  if (!payload.data_templates.length) return { ok: false, error: '没有可提交的 Template ID' };
  for (const dataTemplate of payload.data_templates) {
    const result = await createDataTemplate(dataTemplate);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/** Submit the 报告取数配置 payload for agent processing. */
export async function submitReportConfig(payload: unknown): Promise<SubmitResult> {
  const result = await createReportDataTemplate(payload);
  return result.ok ? { ok: true } : result;
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
  return request('POST', `/api/superchart/templates/${encodeURIComponent(templateId)}/batch-update`, payload);
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
