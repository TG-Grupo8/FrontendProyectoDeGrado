/**
 * Pruebas unitarias de src/app/lib/api.ts
 * ========================================
 *
 * El módulo expone un wrapper de fetch con autenticación Bearer y
 * varios grupos de endpoints (auth, documents, jobs, graph, metrics).
 *
 * Estrategia de mocking:
 *   - `fetch` se reemplaza con vi.fn() antes de cada test.
 *   - `localStorage` viene de jsdom y está disponible directamente.
 *
 * Cubre:
 *   - request(): respuesta exitosa, error HTTP, respuesta 204
 *   - authHeaders(): con y sin token en localStorage
 *   - authApi.login / authApi.register / authApi.me
 *   - documentsApi.list / documentsApi.upload / documentsApi.delete
 *   - jobsApi.list / jobsApi.result / jobsApi.validate / jobsApi.exportUrl
 *   - graphApi.entities / graphApi.neighbors
 *   - metricsApi.get
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authApi, documentsApi, jobsApi, graphApi, metricsApi } from '../app/lib/api'

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    statusText: status === 200 ? 'OK' : 'Error',
  }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
  return response
}

function mockFetch204() {
  const response = { ok: true, status: 204, json: vi.fn(), statusText: 'No Content' }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── request() ────────────────────────────────────────────────────────────────

describe('request (función interna)', () => {
  it('retorna el JSON de la respuesta cuando es exitosa', async () => {
    mockFetch({ access_token: 'tok', token_type: 'bearer', user: { id: '1' } })
    const data = await authApi.login('a@b.com', 'pass')
    expect(data.access_token).toBe('tok')
  })

  it('lanza Error con el detail del cuerpo cuando la respuesta no es ok', async () => {
    mockFetch({ detail: 'Credenciales inválidas' }, 401)
    await expect(authApi.login('x@x.com', 'wrong')).rejects.toThrow('Credenciales inválidas')
  })

  it('lanza Error con el statusText si el cuerpo no tiene detail', async () => {
    const response = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockRejectedValue(new Error('invalid json')),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    await expect(authApi.me()).rejects.toThrow('Internal Server Error')
  })

  it('retorna undefined para respuestas 204', async () => {
    mockFetch204()
    const result = await documentsApi.delete('doc-id')
    expect(result).toBeUndefined()
  })
})

// ── authApi ───────────────────────────────────────────────────────────────────

describe('authApi', () => {
  it('login llama a POST /auth/login con email y password', async () => {
    const mockData = { access_token: 'abc', token_type: 'bearer', user: { id: '1', name: 'Ada', email: 'ada@test.com', created_at: '' } }
    mockFetch(mockData)
    await authApi.login('ada@test.com', 'pass123')

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ email: 'ada@test.com', password: 'pass123' })
  })

  it('register llama a POST /auth/register con name, email, password', async () => {
    mockFetch({ id: '2', name: 'Ada', email: 'ada@test.com', created_at: '' })
    await authApi.register('Ada', 'ada@test.com', 'pass123')

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/auth/register')
    expect(JSON.parse(init.body)).toMatchObject({ name: 'Ada', email: 'ada@test.com', password: 'pass123' })
  })

  it('me incluye el header Authorization cuando hay token en localStorage', async () => {
    localStorage.setItem('token', 'my-jwt')
    mockFetch({ id: '1', name: 'Ada', email: 'ada@test.com', created_at: '' })
    await authApi.me()

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers['Authorization']).toBe('Bearer my-jwt')
  })

  it('me no incluye Authorization cuando no hay token', async () => {
    mockFetch({ id: '1', name: 'Ada', email: 'ada@test.com', created_at: '' })
    await authApi.me()

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers['Authorization']).toBeUndefined()
  })
})

// ── documentsApi ──────────────────────────────────────────────────────────────

describe('documentsApi', () => {
  it('list llama a GET /documents/ con limit y offset por defecto', async () => {
    mockFetch({ items: [], total: 0, limit: 100, offset: 0 })
    await documentsApi.list()

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/documents/')
    expect(url).toContain('limit=100')
    expect(url).toContain('offset=0')
  })

  it('list acepta limit y offset personalizados', async () => {
    mockFetch({ items: [], total: 0, limit: 10, offset: 20 })
    await documentsApi.list(10, 20)

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('limit=10')
    expect(url).toContain('offset=20')
  })

  it('upload llama a POST /documents/upload con FormData', async () => {
    mockFetch({ document_id: 'd1', job_id: 'j1', status: 'PENDING' })
    const file = new File(['pdf content'], 'paper.pdf', { type: 'application/pdf' })
    await documentsApi.upload(file)

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/documents/upload')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('delete llama a DELETE /documents/:id', async () => {
    mockFetch204()
    await documentsApi.delete('doc-xyz')

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/documents/doc-xyz')
    expect(init.method).toBe('DELETE')
  })
})

// ── jobsApi ───────────────────────────────────────────────────────────────────

describe('jobsApi', () => {
  it('list llama a GET /jobs/ sin filtro de status por defecto', async () => {
    mockFetch({ items: [], total: 0, limit: 100, offset: 0 })
    await jobsApi.list()

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/jobs/')
    expect(url).not.toContain('status=')
  })

  it('list incluye status en la query string cuando se proporciona', async () => {
    mockFetch({ items: [], total: 0, limit: 100, offset: 0 })
    await jobsApi.list('APPROVED')

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('status=APPROVED')
  })

  it('result llama a GET /jobs/:id/result', async () => {
    mockFetch({ job_id: 'j1', status: 'READY_FOR_REVIEW', preliminary_result: null })
    await jobsApi.result('j1')

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/jobs/j1/result')
  })

  it('validate llama a POST /jobs/:id/validate con el grafo', async () => {
    mockFetch({ job_id: 'j1', status: 'APPROVED', message: 'ok' })
    const graph = {
      plants: [{ name: 'Aloe vera' }], compounds: [], proteins: [], diseases: [],
      plant_has_compound: [], compound_interacts_with_protein: [],
      compound_associated_with_disease: [], protein_associated_with_disease: [],
    }
    await jobsApi.validate('j1', graph, 'reviewer-1')

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/jobs/j1/validate')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body.reviewer_id).toBe('reviewer-1')
    expect(body.graph).toEqual(graph)
  })

  it('exportUrl retorna la URL correcta sin hacer fetch', () => {
    const url = jobsApi.exportUrl('job-abc', 'csv')
    expect(url).toContain('/jobs/job-abc/export')
    expect(url).toContain('format=csv')
  })
})

// ── graphApi ──────────────────────────────────────────────────────────────────

describe('graphApi', () => {
  it('entities llama a GET /graph/entities sin filtros por defecto', async () => {
    mockFetch({ items: [], total: 0, limit: 100, offset: 0 })
    await graphApi.entities()

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/graph/entities')
  })

  it('entities incluye type y name en la query cuando se pasan', async () => {
    mockFetch({ items: [], total: 0, limit: 100, offset: 0 })
    await graphApi.entities('plant', 'Aloe vera')

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('type=plant')
    expect(url).toContain('name=Aloe+vera')
  })

  it('neighbors llama a la URL correcta con depth', async () => {
    mockFetch({ center: { name: 'Aloe vera', node_type: 'plant' }, nodes: [], edges: [] })
    await graphApi.neighbors('plant', 'Aloe vera', 2)

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/graph/entities/plant/Aloe%20vera/neighbors')
    expect(url).toContain('depth=2')
  })
})

// ── metricsApi ────────────────────────────────────────────────────────────────

describe('metricsApi', () => {
  it('get llama a GET /metrics', async () => {
    mockFetch({ documents: { total: 5 }, jobs: { by_status: {}, total_approved: 2, total_failed: 1, avg_processing_seconds: null } })
    await metricsApi.get()

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toContain('/metrics')
  })
})
