/**
 * Pruebas unitarias de src/app/components/FilterChip.tsx
 * =======================================================
 *
 * FilterChip es un botón de filtro que alterna entre estado activo
 * e inactivo.  Cubre: renderizado del label, disparo de onClick,
 * estilos activo/inactivo y colores por tipo de entidad.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterChip } from '../app/components/FilterChip'

describe('FilterChip', () => {
  describe('renderizado básico', () => {
    it('muestra el label recibido', () => {
      render(<FilterChip label="Planta" active={false} onClick={() => {}} />)
      expect(screen.getByText('Planta')).toBeInTheDocument()
    })

    it('renderiza como elemento <button>', () => {
      render(<FilterChip label="Test" active={false} onClick={() => {}} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('interacción onClick', () => {
    it('llama a onClick al hacer clic', async () => {
      const handleClick = vi.fn()
      render(<FilterChip label="Clic" active={false} onClick={handleClick} />)
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('llama a onClick múltiples veces si se hace clic repetidamente', async () => {
      const handleClick = vi.fn()
      render(<FilterChip label="Multi" active={false} onClick={handleClick} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('estilos activo vs inactivo', () => {
    it('usa fontWeight 500 cuando está activo', () => {
      render(<FilterChip label="A" active={true} onClick={() => {}} type="plant" />)
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.style.fontWeight).toBe('500')
    })

    it('usa fontWeight 400 cuando está inactivo', () => {
      render(<FilterChip label="A" active={false} onClick={() => {}} type="plant" />)
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.style.fontWeight).toBe('400')
    })

    it('usa color de fondo neutro cuando está inactivo', () => {
      render(<FilterChip label="A" active={false} onClick={() => {}} type="plant" />)
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.style.backgroundColor).toBe('rgb(245, 245, 243)') // #F5F5F3
    })

    it('usa el color del tipo cuando está activo', () => {
      render(<FilterChip label="A" active={true} onClick={() => {}} type="plant" />)
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.style.backgroundColor).toBe('rgb(225, 245, 238)') // #E1F5EE (plant)
    })
  })

  describe('colores por tipo de entidad (activo)', () => {
    it.each([
      ['protein', 'rgb(238, 237, 254)'],   // #EEEDFE
      ['plant',   'rgb(225, 245, 238)'],   // #E1F5EE
      ['compound','rgb(250, 238, 218)'],   // #FAEEDA
      ['disease', 'rgb(250, 236, 231)'],   // #FAECE7
      ['all',     'rgb(24, 95, 165)'],     // #185FA5
    ] as const)('tipo %s usa fondo %s', (type, expectedColor) => {
      render(<FilterChip label="X" active={true} onClick={() => {}} type={type} />)
      const btn = screen.getByRole('button') as HTMLButtonElement
      expect(btn.style.backgroundColor).toBe(expectedColor)
    })
  })
})
