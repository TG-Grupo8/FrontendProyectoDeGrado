/**
 * Pruebas unitarias de src/app/components/StatCard.tsx
 * =====================================================
 *
 * StatCard muestra una métrica numérica o textual con su etiqueta
 * descriptiva.  Cubre: renderizado de value (número y string) y label.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '../app/components/StatCard'

describe('StatCard', () => {
  it('muestra el valor numérico recibido', () => {
    render(<StatCard value={42} label="Documentos" />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('muestra el valor como string', () => {
    render(<StatCard value="N/A" label="Procesamiento" />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('muestra el label recibido', () => {
    render(<StatCard value={10} label="Artículos aprobados" />)
    expect(screen.getByText('Artículos aprobados')).toBeInTheDocument()
  })

  it('muestra value 0 correctamente', () => {
    render(<StatCard value={0} label="Errores" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renderiza tanto value como label juntos', () => {
    render(<StatCard value={7} label="Jobs fallidos" />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Jobs fallidos')).toBeInTheDocument()
  })
})
