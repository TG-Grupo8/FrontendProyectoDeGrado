/**
 * Pruebas unitarias de src/app/components/ui/utils.ts
 * ====================================================
 *
 * La función `cn` combina clsx (clases condicionales) con
 * tailwind-merge (resolución de conflictos de utilidades Tailwind).
 * Es una utilidad pura: sin efectos secundarios ni dependencias externas.
 */

import { describe, it, expect } from 'vitest'
import { cn } from '../app/components/ui/utils'

describe('cn', () => {
  it('retorna una clase simple sin modificarla', () => {
    expect(cn('text-sm')).toBe('text-sm')
  })

  it('concatena múltiples clases', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('omite valores falsy (undefined, null, false)', () => {
    expect(cn('text-sm', undefined, null, false)).toBe('text-sm')
  })

  it('incluye clases condicionales que son true', () => {
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('omite clases condicionales que son false', () => {
    expect(cn('base', false && 'active')).toBe('base')
  })

  it('resuelve conflictos Tailwind: la última clase gana', () => {
    // tailwind-merge debe elegir p-4 sobre p-2
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('resuelve conflictos de texto Tailwind', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('acepta objetos de clases condicionales', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('retorna cadena vacía cuando no hay argumentos', () => {
    expect(cn()).toBe('')
  })

  it('combina arrays, objetos y strings', () => {
    const result = cn(['px-2', 'py-1'], { 'text-white': true }, 'rounded')
    expect(result).toContain('px-2')
    expect(result).toContain('py-1')
    expect(result).toContain('text-white')
    expect(result).toContain('rounded')
  })
})
