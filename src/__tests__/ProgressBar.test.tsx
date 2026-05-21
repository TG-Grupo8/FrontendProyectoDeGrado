/**
 * Pruebas unitarias de src/app/components/ProgressBar.tsx
 * ========================================================
 *
 * ProgressBar muestra una barra de progreso con label, porcentaje
 * numérico y un relleno visual proporcional al valor recibido.
 * Cubre: texto del label, texto del porcentaje, ancho de la barra
 * y color de relleno.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../app/components/ProgressBar'

describe('ProgressBar', () => {
  describe('contenido textual', () => {
    it('muestra el label recibido', () => {
      render(<ProgressBar label="Procesados" percentage={40} color="#1D9E75" />)
      expect(screen.getByText('Procesados')).toBeInTheDocument()
    })

    it('muestra el porcentaje con símbolo %', () => {
      render(<ProgressBar label="Aprobados" percentage={75} color="#1D9E75" />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('muestra 0% cuando el porcentaje es cero', () => {
      render(<ProgressBar label="Pendientes" percentage={0} color="#888780" />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('muestra 100% cuando el porcentaje es cien', () => {
      render(<ProgressBar label="Completados" percentage={100} color="#1D9E75" />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('barra de relleno', () => {
    it('el ancho del relleno refleja el porcentaje recibido', () => {
      const { container } = render(<ProgressBar label="X" percentage={60} color="#BA7517" />)
      // Estructura: div.mb-3 > div.flex (label) + div (pista) > div (relleno)
      // querySelectorAll('div > div') devuelve [label-row, pista, relleno] → índice 2
      const fill = container.querySelectorAll('div > div')[3] as HTMLElement
      expect(fill.style.width).toBe('60%')
    })

    it('aplica el color recibido al relleno', () => {
      const { container } = render(<ProgressBar label="X" percentage={50} color="#D85A30" />)
      const fill = container.querySelectorAll('div > div')[3] as HTMLElement
      expect(fill.style.backgroundColor).toBe('rgb(216, 90, 48)') // #D85A30
    })

    it('el relleno tiene width 0% cuando percentage=0', () => {
      const { container } = render(<ProgressBar label="X" percentage={0} color="#000" />)
      const fill = container.querySelectorAll('div > div')[3] as HTMLElement
      expect(fill.style.width).toBe('0%')
    })
  })
})
