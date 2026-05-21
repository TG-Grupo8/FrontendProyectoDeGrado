/**
 * Pruebas unitarias de src/app/context/AuthContext.tsx
 * =====================================================
 *
 * AuthContext gestiona el estado de autenticación del usuario:
 * token en localStorage, datos del usuario y las funciones login/logout.
 *
 * Estrategia de mocking:
 *   - authApi se mockea con vi.mock para controlar las respuestas.
 *   - localStorage de jsdom está disponible directamente.
 *   - Se usa un componente helper que expone el contexto al DOM
 *     para poder leer el estado en los tests.
 *
 * Cubre:
 *   - Estado inicial sin token (isLoading=false, user=null)
 *   - Carga de usuario al arrancar si hay token guardado
 *   - Limpieza del token si /auth/me falla al arrancar
 *   - login(): guarda token, actualiza user
 *   - logout(): limpia token y user
 *   - useAuth() fuera del provider lanza error
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../app/context/AuthContext'

// ── Mock de authApi ───────────────────────────────────────────────────────────

vi.mock('../app/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}))

import { authApi } from '../app/lib/api'
const mockAuthApi = authApi as { login: ReturnType<typeof vi.fn>; me: ReturnType<typeof vi.fn> }

// ── Helper: componente que expone el contexto al DOM ─────────────────────────

function TestConsumer() {
  const { user, token, isLoading, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="token">{token ?? 'null'}</span>
      <button onClick={() => login('ada@test.com', 'pass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  )
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthProvider — estado inicial', () => {
  it('isLoading es false y user es null cuando no hay token guardado', async () => {
    mockAuthApi.me.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.com', created_at: '' })
    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('no llama a authApi.me cuando no hay token en localStorage', async () => {
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(mockAuthApi.me).not.toHaveBeenCalled()
  })
})

describe('AuthProvider — carga desde localStorage', () => {
  it('llama a authApi.me y rellena user si hay token guardado', async () => {
    localStorage.setItem('token', 'existing-jwt')
    mockAuthApi.me.mockResolvedValue({ id: '99', name: 'Ada', email: 'ada@stored.com', created_at: '' })

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('ada@stored.com')
    })
    expect(mockAuthApi.me).toHaveBeenCalledTimes(1)
  })

  it('limpia el token de localStorage si authApi.me falla', async () => {
    localStorage.setItem('token', 'invalid-jwt')
    mockAuthApi.me.mockRejectedValue(new Error('401'))

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(localStorage.getItem('token')).toBeNull()
    expect(screen.getByTestId('user').textContent).toBe('null')
  })
})

describe('AuthProvider — login()', () => {
  it('guarda el token en localStorage y actualiza user', async () => {
    mockAuthApi.me.mockResolvedValue(null) // sin token inicial
    mockAuthApi.login.mockResolvedValue({
      access_token: 'new-token',
      token_type: 'bearer',
      user: { id: '1', name: 'Ada', email: 'ada@test.com', created_at: '' },
    })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await userEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('ada@test.com')
      expect(screen.getByTestId('token').textContent).toBe('new-token')
    })
    expect(localStorage.getItem('token')).toBe('new-token')
  })

  it('propaga el error de authApi.login si las credenciales son incorrectas', async () => {
    mockAuthApi.me.mockResolvedValue(null)
    mockAuthApi.login.mockRejectedValue(new Error('Credenciales inválidas'))

    // Wrap en un componente que captura el error
    function ErrorConsumer() {
      const { login } = useAuth()
      const [err, setErr] = React.useState('')
      return (
        <>
          <span data-testid="err">{err}</span>
          <button onClick={() => login('x', 'y').catch(e => setErr(e.message))}>Try</button>
        </>
      )
    }

    render(<AuthProvider><ErrorConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Try'))

    await waitFor(() => {
      expect(screen.getByTestId('err').textContent).toBe('Credenciales inválidas')
    })
  })
})

describe('AuthProvider — logout()', () => {
  it('elimina el token de localStorage y pone user en null', async () => {
    localStorage.setItem('token', 'existing-jwt')
    mockAuthApi.me.mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@test.com', created_at: '' })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('ada@test.com'))

    await userEvent.click(screen.getByText('Logout'))

    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(screen.getByTestId('token').textContent).toBe('null')
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('useAuth fuera del provider', () => {
  it('lanza un error descriptivo', () => {
    function Orphan() {
      useAuth()
      return null
    }
    // Silenciar el error de React en consola durante este test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Orphan />)).toThrow('useAuth must be used inside AuthProvider')
    consoleSpy.mockRestore()
  })
})
