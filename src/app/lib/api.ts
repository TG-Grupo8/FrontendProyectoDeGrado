const BASE = import.meta.env.VITE_API_URL as string ?? 'http://localhost:8080/api/v1'
const API_KEY = import.meta.env.VITE_API_KEY as string ?? ''

function authHeaders(withApiKey = false): HeadersInit {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (withApiKey && API_KEY) headers['X-API-Key'] = API_KEY
  return headers
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string
  name: string
  email: string
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserResponse
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<UserResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<UserResponse>('/auth/me', {
      headers: authHeaders(),
    }),
}

// ── Documents ────────────────────────────────────────────────────────────────

export interface DocumentResponse {
  id: string
  filename: string
  doi: string | null
  title: string | null
  authors: string | null
  publication_year: number | null
  source_type: string | null
  notes: string | null
  uploaded_by: string | null
  created_at: string
}

export interface DocumentListResponse {
  items: DocumentResponse[]
  total: number
  limit: number
  offset: number
}

export const documentsApi = {
  list: (limit = 100, offset = 0) =>
    request<DocumentListResponse>(`/documents/?limit=${limit}&offset=${offset}`, {
      headers: authHeaders(),
    }),

  get: (id: string) =>
    request<DocumentResponse>(`/documents/${id}`, {
      headers: authHeaders(),
    }),

  upload: (file: File, meta?: { doi?: string; title?: string; authors?: string; publication_year?: number; notes?: string }) => {
    const form = new FormData()
    form.append('file', file)
    if (meta?.doi) form.append('doi', meta.doi)
    if (meta?.title) form.append('title', meta.title)
    if (meta?.authors) form.append('authors', meta.authors)
    if (meta?.publication_year) form.append('publication_year', String(meta.publication_year))
    if (meta?.notes) form.append('notes', meta.notes)
    return request<{ document_id: string; job_id: string; status: string }>('/documents/upload', {
      method: 'POST',
      headers: authHeaders(true),
      body: form,
    })
  },

  delete: (id: string) =>
    request<void>(`/documents/${id}`, {
      method: 'DELETE',
      headers: authHeaders(true),
    }),
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export interface JobResponse {
  id: string
  document_id: string
  status: string
  progress: number
  progress_step: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface JobListResponse {
  items: JobResponse[]
  total: number
  limit: number
  offset: number
}

export interface GraphPayload {
  plants: { name: string }[]
  compounds: { name: string }[]
  proteins: { name: string }[]
  diseases: { name: string }[]
  plant_has_compound: { plant_name: string; compound_name: string; confidence_score: number }[]
  compound_interacts_with_protein: { compound_name: string; protein_name: string; confidence_score: number }[]
  compound_associated_with_disease: { compound_name: string; disease_name: string; confidence_score: number }[]
}

export const jobsApi = {
  list: (status?: string, limit = 100, offset = 0) => {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) qs.set('status', status)
    return request<JobListResponse>(`/jobs/?${qs}`, { headers: authHeaders() })
  },

  get: (id: string) =>
    request<JobResponse>(`/jobs/${id}`, { headers: authHeaders() }),

  result: (id: string) =>
    request<{ job_id: string; status: string; preliminary_result: GraphPayload | null }>(`/jobs/${id}/result`, {
      headers: authHeaders(),
    }),

  validate: (id: string, graph: GraphPayload, reviewerId?: string) =>
    request<{ job_id: string; status: string; message: string }>(`/jobs/${id}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(true) },
      body: JSON.stringify({ reviewer_id: reviewerId ?? null, metadata: {}, graph }),
    }),

  reject: (id: string, reason?: string) =>
    request<JobResponse>(`/jobs/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ reason: reason ?? null }),
    }),

  exportUrl: (id: string, format: 'json' | 'csv') =>
    `${BASE}/jobs/${id}/export?format=${format}`,
}

// ── Graph ────────────────────────────────────────────────────────────────────

export interface EntityNode {
  name: string
  node_type: string
}

export interface GraphEdgeResponse {
  from_name: string
  from_type: string
  relation_type: string
  to_name: string
  to_type: string
  source_id?: string
  confidence_score?: number
}

export interface EntityListResponse {
  items: EntityNode[]
  total: number
  limit: number
  offset: number
}

export interface NeighborhoodResponse {
  center: EntityNode
  nodes: EntityNode[]
  edges: GraphEdgeResponse[]
}

export interface SourceGraphResponse {
  source_id: string
  nodes: EntityNode[]
  edges: GraphEdgeResponse[]
}

export const graphApi = {
  entities: (type?: string, name?: string, limit = 100, offset = 0) => {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (type) qs.set('type', type)
    if (name) qs.set('name', name)
    return request<EntityListResponse>(`/graph/entities?${qs}`, { headers: authHeaders() })
  },

  neighbors: (nodeType: string, name: string, depth = 1) =>
    request<NeighborhoodResponse>(
      `/graph/entities/${nodeType}/${encodeURIComponent(name)}/neighbors?depth=${depth}`,
      { headers: authHeaders() },
    ),

  bySource: (sourceId: string) =>
    request<SourceGraphResponse>(
      `/graph/sources/${sourceId}`,
      { headers: authHeaders() },
    ),
}

// ── Metrics ──────────────────────────────────────────────────────────────────

export interface MetricsResponse {
  documents: { total: number }
  jobs: {
    by_status: Record<string, number>
    total_approved: number
    total_failed: number
    avg_processing_seconds: number | null
  }
}

export const metricsApi = {
  get: () => request<MetricsResponse>('/metrics', { headers: authHeaders() }),
}
