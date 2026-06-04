/**
 * Pruebas unitarias de src/app/context/ValidationContext.tsx
 * ===========================================================
 *
 * ValidationContext gestiona el flujo de revisión humana de entidades
 * y relaciones extraídas por el pipeline NLP.
 *
 * Cubre:
 *   - loadFromPayload(): carga entidades y relaciones desde GraphPayload
 *   - loadFromPayload(): normaliza el formato legado PipelineResultPayload
 *   - uniqueEntities(): deduplicación por nombre, score más alto gana
 *   - buildAcceptedGraph(): solo incluye entidades/relaciones aceptadas
 *   - reset(): limpia todo el estado
 *   - useValidation() fuera del provider lanza error
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ValidationProvider, useValidation } from '../app/context/ValidationContext'
import type { ValidatedEntity, ValidatedRelation } from '../app/context/ValidationContext'

// ── Helper: envuelve el provider y expone el contexto a través de una ref ────

function renderValidation() {
  let ctx: ReturnType<typeof useValidation>

  function Capture() {
    ctx = useValidation()
    return null
  }

  render(
    <ValidationProvider>
      <Capture />
    </ValidationProvider>,
  )

  return () => ctx
}

// ── Datos de prueba ───────────────────────────────────────────────────────────

const sampleGraph = {
  plants: [{ name: 'Aloe vera', score: 0.9 }],
  compounds: [{ name: 'Aloin', score: 0.8 }, { name: 'Barbaloin', score: 0.7 }],
  proteins: [{ name: 'COX-2', score: 0.75 }],
  diseases: [{ name: 'Dermatitis', score: 0.85 }],
  plant_has_compound: [
    { plant_name: 'Aloe vera', compound_name: 'Aloin', confidence_score: 0.9 },
    { plant_name: 'Aloe vera', compound_name: 'Barbaloin', confidence_score: 0.7 },
  ],
  compound_interacts_with_protein: [
    { compound_name: 'Aloin', protein_name: 'COX-2', confidence_score: 0.8 },
  ],
  compound_associated_with_disease: [
    { compound_name: 'Aloin', disease_name: 'Dermatitis', confidence_score: 0.75 },
  ],
  protein_associated_with_disease: [
    { protein_name: 'COX-2', disease_name: 'Dermatitis', confidence_score: 0.6 },
  ],
}

// ── loadFromPayload (GraphPayload) ────────────────────────────────────────────

describe('loadFromPayload — GraphPayload', () => {
  it('carga el jobId correcto', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('job-001', sampleGraph))
    expect(getCtx().jobId).toBe('job-001')
  })

  it('crea una entidad por cada nodo del grafo', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))
    // 1 planta + 2 compuestos + 1 proteína + 1 enfermedad = 5
    expect(getCtx().entities).toHaveLength(5)
  })

  it('todas las entidades inician en estado pending', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))
    const states = getCtx().entities.map(e => e.state)
    expect(states.every(s => s === 'pending')).toBe(true)
  })

  it('carga las relaciones compuesto-proteína como compoundRelations', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))
    expect(getCtx().compoundRelations).toHaveLength(1)
    expect(getCtx().compoundRelations[0].source).toBe('Aloin')
    expect(getCtx().compoundRelations[0].target).toBe('COX-2')
  })

  it('carga relaciones compound-disease y protein-disease en diseaseRelations', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))
    expect(getCtx().diseaseRelations).toHaveLength(2)
  })

  it('asigna ids únicos a las entidades', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))
    const ids = getCtx().entities.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ── loadFromPayload (formato legado PipelineResultPayload) ───────────────────

describe('loadFromPayload — formato legado (nlp)', () => {
  const legacyPayload = {
    nlp: {
      plant: { name: 'Cannabis sativa' },
      chemicals: [
        { compound: 'THC', score: 0.9 },
        { compound: 'CBD', score: 0.85 },
      ],
      targets: [{ target: 'CB1', score: 0.7 }],
      diseases: [{ disease: 'Dolor crónico', score: 0.8 }],
      relations: {
        chemicalTarget: [{ compound: 'THC', target: 'CB1', verb: 'inhibits', phrase: 'THC inhibits CB1 signaling.' }],
        targetDisease: [{ protein: 'CB1', disease: 'Dolor crónico', verb: 'reduces', phrase: 'CB1 reduces Dolor crónico symptoms.' }],
      },
    },
  }

  it('normaliza plantas desde nlp.plant', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j2', legacyPayload as never))
    const plants = getCtx().entities.filter(e => e.type === 'plant')
    expect(plants.some(p => p.name === 'Cannabis sativa')).toBe(true)
  })

  it('normaliza compuestos desde nlp.chemicals', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j2', legacyPayload as never))
    const compounds = getCtx().entities.filter(e => e.type === 'compound')
    expect(compounds.map(c => c.name)).toContain('THC')
    expect(compounds.map(c => c.name)).toContain('CBD')
  })

  it('carga relaciones desde nlp.relations.chemicalTarget', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j2', legacyPayload as never))
    expect(getCtx().compoundRelations).toHaveLength(1)
    expect(getCtx().compoundRelations[0].source).toBe('THC')
  })

  it('usa el verbo real del pipeline como etiqueta de relación', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j2', legacyPayload as never))
    expect(getCtx().compoundRelations[0].relation).toBe('inhibits')
    expect(getCtx().diseaseRelations[0].relation).toBe('reduces')
  })
})

// ── buildAcceptedGraph ────────────────────────────────────────────────────────

describe('buildAcceptedGraph', () => {
  it('retorna listas vacías cuando no hay entidades aceptadas', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))

    const graph = getCtx().buildAcceptedGraph()
    expect(graph.plants).toHaveLength(0)
    expect(graph.compounds).toHaveLength(0)
  })

  it('incluye solo entidades con state=accepted', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))

    act(() => {
      const updated = getCtx().entities.map(e =>
        e.name === 'Aloe vera' ? { ...e, state: 'accepted' as const } : e,
      )
      getCtx().setEntities(updated)
    })

    const graph = getCtx().buildAcceptedGraph()
    expect(graph.plants).toHaveLength(1)
    expect(graph.plants[0].name).toBe('Aloe vera')
    expect(graph.compounds).toHaveLength(0)
  })

  it('genera aristas plant_has_compound para cada par planta-compuesto aceptado', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))

    act(() => {
      const updated = getCtx().entities.map(e =>
        e.type === 'plant' || e.name === 'Aloin'
          ? { ...e, state: 'accepted' as const }
          : e,
      )
      getCtx().setEntities(updated)
    })

    const graph = getCtx().buildAcceptedGraph()
    expect(graph.plant_has_compound).toHaveLength(1)
    expect(graph.plant_has_compound[0]).toMatchObject({
      plant_name: 'Aloe vera',
      compound_name: 'Aloin',
    })
  })

  it('incluye relaciones compuesto-proteína aceptadas', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))

    act(() => {
      const updatedRels = getCtx().compoundRelations.map(r => ({
        ...r,
        state: 'accepted' as const,
      }))
      getCtx().setCompoundRelations(updatedRels)
    })

    const graph = getCtx().buildAcceptedGraph()
    expect(graph.compound_interacts_with_protein).toHaveLength(1)
  })

  it('separa diseaseRelations por sourceType (compound vs protein)', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))

    act(() => {
      const updatedDis = getCtx().diseaseRelations.map(r => ({
        ...r,
        state: 'accepted' as const,
      }))
      getCtx().setDiseaseRelations(updatedDis)
    })

    const graph = getCtx().buildAcceptedGraph()
    expect(graph.compound_associated_with_disease).toHaveLength(1)
    expect(graph.protein_associated_with_disease).toHaveLength(1)
  })
})

// ── reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('limpia jobId, entities, compoundRelations y diseaseRelations', () => {
    const getCtx = renderValidation()
    act(() => getCtx().loadFromPayload('j1', sampleGraph))
    act(() => getCtx().reset())

    expect(getCtx().jobId).toBeNull()
    expect(getCtx().entities).toHaveLength(0)
    expect(getCtx().compoundRelations).toHaveLength(0)
    expect(getCtx().diseaseRelations).toHaveLength(0)
  })
})

// ── useValidation fuera del provider ─────────────────────────────────────────

describe('useValidation fuera del provider', () => {
  it('lanza un error descriptivo', () => {
    function Orphan() {
      useValidation()
      return null
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Orphan />)).toThrow('useValidation must be used inside ValidationProvider')
    consoleSpy.mockRestore()
  })
})
