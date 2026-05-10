import React, { createContext, useContext, useState } from 'react'
import type { GraphPayload } from '../lib/api'

type EntityState = 'pending' | 'accepted' | 'rejected'

export interface ValidatedEntity {
  id: string
  name: string
  type: 'plant' | 'compound' | 'protein' | 'disease'
  state: EntityState
}

export interface ValidatedRelation {
  id: string
  source: string
  sourceType: 'plant' | 'compound' | 'protein' | 'disease'
  target: string
  targetType: 'plant' | 'compound' | 'protein' | 'disease'
  relation: string
  confidence: number
  state: EntityState
}

interface ValidationContextValue {
  jobId: string | null
  entities: ValidatedEntity[]
  compoundRelations: ValidatedRelation[]
  diseaseRelations: ValidatedRelation[]
  setJobId: (id: string) => void
  setEntities: (e: ValidatedEntity[]) => void
  setCompoundRelations: (r: ValidatedRelation[]) => void
  setDiseaseRelations: (r: ValidatedRelation[]) => void
  loadFromPayload: (jobId: string, payload: GraphPayload) => void
  buildAcceptedGraph: () => GraphPayload
  reset: () => void
}

const ValidationContext = createContext<ValidationContextValue | null>(null)

export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [entities, setEntities] = useState<ValidatedEntity[]>([])
  const [compoundRelations, setCompoundRelations] = useState<ValidatedRelation[]>([])
  const [diseaseRelations, setDiseaseRelations] = useState<ValidatedRelation[]>([])

  const loadFromPayload = (id: string, p: GraphPayload) => {
    setJobId(id)

    const ents: ValidatedEntity[] = [
      ...p.plants.map((n, i) => ({ id: `plant-${i}`, name: n.name, type: 'plant' as const, state: 'pending' as const })),
      ...p.compounds.map((n, i) => ({ id: `compound-${i}`, name: n.name, type: 'compound' as const, state: 'pending' as const })),
      ...p.proteins.map((n, i) => ({ id: `protein-${i}`, name: n.name, type: 'protein' as const, state: 'pending' as const })),
      ...p.diseases.map((n, i) => ({ id: `disease-${i}`, name: n.name, type: 'disease' as const, state: 'pending' as const })),
    ]
    setEntities(ents)

    setCompoundRelations(
      p.compound_interacts_with_protein.map((e, i) => ({
        id: `cp-${i}`,
        source: e.compound_name,
        sourceType: 'compound' as const,
        target: e.protein_name,
        targetType: 'protein' as const,
        relation: 'INTERACTÚA',
        confidence: e.confidence_score,
        state: 'pending' as const,
      })),
    )

    setDiseaseRelations(
      p.compound_associated_with_disease.map((e, i) => ({
        id: `cd-${i}`,
        source: e.compound_name,
        sourceType: 'compound' as const,
        target: e.disease_name,
        targetType: 'disease' as const,
        relation: 'ASOCIADA',
        confidence: e.confidence_score,
        state: 'pending' as const,
      })),
    )
  }

  const buildAcceptedGraph = (): GraphPayload => {
    const accepted = entities.filter(e => e.state === 'accepted')
    return {
      plants: accepted.filter(e => e.type === 'plant').map(e => ({ name: e.name })),
      compounds: accepted.filter(e => e.type === 'compound').map(e => ({ name: e.name })),
      proteins: accepted.filter(e => e.type === 'protein').map(e => ({ name: e.name })),
      diseases: accepted.filter(e => e.type === 'disease').map(e => ({ name: e.name })),
      plant_has_compound: [],
      compound_interacts_with_protein: compoundRelations
        .filter(r => r.state === 'accepted')
        .map(r => ({ compound_name: r.source, protein_name: r.target, confidence_score: r.confidence })),
      compound_associated_with_disease: diseaseRelations
        .filter(r => r.state === 'accepted')
        .map(r => ({ compound_name: r.source, disease_name: r.target, confidence_score: r.confidence })),
    }
  }

  const reset = () => {
    setJobId(null); setEntities([]); setCompoundRelations([]); setDiseaseRelations([])
  }

  return (
    <ValidationContext.Provider value={{
      jobId, entities, compoundRelations, diseaseRelations,
      setJobId, setEntities, setCompoundRelations, setDiseaseRelations,
      loadFromPayload, buildAcceptedGraph, reset,
    }}>
      {children}
    </ValidationContext.Provider>
  )
}

export function useValidation() {
  const ctx = useContext(ValidationContext)
  if (!ctx) throw new Error('useValidation must be used inside ValidationProvider')
  return ctx
}
