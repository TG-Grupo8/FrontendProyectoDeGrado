/**
 * Pruebas unitarias de src/app/components/EntityTag.tsx
 * ======================================================
 *
 * EntityTag es un badge visual que representa una entidad del grafo
 * de conocimiento (plant, compound, protein, disease, all).
 * Cubre: renderizado del label, tamaños sm/md, visibilidad del punto
 * de color y aplicación de estilos por tipo.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntityTag } from '../app/components/EntityTag'

describe('EntityTag', () => {
  describe('renderizado básico', () => {
    it('muestra el label recibido como prop', () => {
      render(<EntityTag type="plant" label="Aloe vera" />)
      expect(screen.getByText('Aloe vera')).toBeInTheDocument()
    })

    it('renderiza como elemento <span>', () => {
      const { container } = render(<EntityTag type="compound" label="Aloin" />)
      expect(container.querySelector('span')).toBeInTheDocument()
    })
  })

  describe('prop showDot', () => {
    it('muestra el punto de color por defecto (showDot=true)', () => {
      const { container } = render(<EntityTag type="plant" label="Test" />)
      // El dot es un span hijo vacío con clase de tamaño
      const dots = container.querySelectorAll('span > span')
      expect(dots.length).toBeGreaterThan(0)
    })

    it('oculta el punto cuando showDot=false', () => {
      const { container } = render(<EntityTag type="plant" label="Test" showDot={false} />)
      const dots = container.querySelectorAll('span > span')
      expect(dots.length).toBe(0)
    })
  })

  describe('prop size', () => {
    it('usa fontSize 12px por defecto (size=md)', () => {
      const { container } = render(<EntityTag type="disease" label="Fever" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.fontSize).toBe('12px')
    })

    it('usa fontSize 10px cuando size=sm', () => {
      const { container } = render(<EntityTag type="disease" label="Fever" size="sm" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.fontSize).toBe('10px')
    })
  })

  describe('colores por tipo de entidad', () => {
    it('aplica color de fondo correcto para plant', () => {
      const { container } = render(<EntityTag type="plant" label="P" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.backgroundColor).toBe('rgb(225, 245, 238)') // #E1F5EE
    })

    it('aplica color de fondo correcto para compound', () => {
      const { container } = render(<EntityTag type="compound" label="C" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.backgroundColor).toBe('rgb(250, 238, 218)') // #FAEEDA
    })

    it('aplica color de fondo correcto para protein', () => {
      const { container } = render(<EntityTag type="protein" label="P" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.backgroundColor).toBe('rgb(238, 237, 254)') // #EEEDFE
    })

    it('aplica color de fondo correcto para disease', () => {
      const { container } = render(<EntityTag type="disease" label="D" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.backgroundColor).toBe('rgb(250, 236, 231)') // #FAECE7
    })

    it('aplica color de fondo correcto para all', () => {
      const { container } = render(<EntityTag type="all" label="Todos" />)
      const tag = container.querySelector('span') as HTMLElement
      expect(tag.style.backgroundColor).toBe('rgb(24, 95, 165)') // #185FA5
    })
  })
})
