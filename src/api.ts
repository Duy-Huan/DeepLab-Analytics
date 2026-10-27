import { Project, ExperimentRun, ScientificReport, IntegrationConfig } from './types';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(data: {
  name: string;
  description: string;
  domain: string;
  dataset: string;
  tags: string[];
}): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create project');
  }
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

export async function fetchRuns(projectId?: string, dataset?: string): Promise<ExperimentRun[]> {
  const params = new URLSearchParams();
  if (projectId) params.set('projectId', projectId);
  if (dataset) params.set('dataset', dataset);
  const res = await fetch(`/api/runs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch runs');
  return res.json();
}

export async function fetchRunById(id: string): Promise<ExperimentRun> {
  const res = await fetch(`/api/runs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch run');
  return res.json();
}

export async function createRun(runData: any): Promise<ExperimentRun> {
  const res = await fetch('/api/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create run');
  }
  return res.json();
}

export async function deleteRun(id: string): Promise<void> {
  const res = await fetch(`/api/runs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete run');
}

export async function importRun(data: {
  project_id: string;
  format: 'json' | 'csv' | 'tensorboard';
  payload: string;
  override_name?: string;
}): Promise<ExperimentRun> {
  const res = await fetch('/api/runs/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to import run');
  }
  return res.json();
}

export async function analyzeRuns(
  runIds: string[],
  focus = 'general',
  prompt?: string
): Promise<{
  measured_evidence: string[];
  derived_calculations: string[];
  ai_hypotheses: string[];
  recommended_experiments: string[];
  raw_markdown: string;
}> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ run_ids: runIds, focus, prompt }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to run AI analysis');
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  runIds: string[],
  history: { role: 'user' | 'assistant' | 'system'; content: string }[],
  projectId?: string
): Promise<{ reply: string; runs_referenced: string[] }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, run_ids: runIds, history, project_id: projectId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Chat request failed');
  }
  return res.json();
}

export async function fetchReports(projectId?: string): Promise<ScientificReport[]> {
  const url = projectId ? `/api/reports?projectId=${projectId}` : '/api/reports';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function createReport(data: any): Promise<ScientificReport> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create report');
  return res.json();
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete report');
}

export async function fetchIntegrations(): Promise<IntegrationConfig[]> {
  const res = await fetch('/api/integrations');
  if (!res.ok) throw new Error('Failed to fetch integrations');
  return res.json();
}

export async function testIntegration(id: string): Promise<{ connected: boolean; latency_ms?: number; message: string }> {
  const res = await fetch('/api/integrations/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to test integration');
  return res.json();
}
