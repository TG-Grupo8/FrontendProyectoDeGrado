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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadFromPayload: (jobId: string, payload: any) => void
  buildAcceptedGraph: () => GraphPayload
  reset: () => void
}

const ValidationContext = createContext<ValidationContextValue | null>(null)

export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [entities, setEntities] = useState<ValidatedEntity[]>([])
  const [compoundRelations, setCompoundRelations] = useState<ValidatedRelation[]>([])
  const [diseaseRelations, setDiseaseRelations] = useState<ValidatedRelation[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadFromPayload = (id: string, p: any) => {
    setJobId(id)

    // Support raw pipeline result format (p.nlp.*) and GraphPayload format (p.plants/compounds/...)
    const nlp = p.nlp ?? p
    const plants: string[]    = nlp.plants    ? nlp.plants.map((x: any) => x.plant ?? x.name).filter(Boolean)    : (p.plants    ?? []).map((x: any) => x.name)
    const compounds: string[] = nlp.chemicals ? nlp.chemicals.map((x: any) => x.compound ?? x.name).filter(Boolean) : (p.compounds  ?? []).map((x: any) => x.name)
    const proteins: string[]  = nlp.targets   ? nlp.targets.map((x: any) => x.target ?? x.name).filter(Boolean)   : (p.proteins   ?? []).map((x: any) => x.name)
    const diseases: string[]  = nlp.diseases  ? nlp.diseases.map((x: any) => x.disease ?? x.name).filter(Boolean)  : (p.diseases   ?? []).map((x: any) => x.name)

    const ents: ValidatedEntity[] = [
      ...plants.map((name, i)    => ({ id: `plant-${i}`,    name, type: 'plant'    as const, state: 'pending' as const })),
      ...compounds.map((name, i) => ({ id: `compound-${i}`, name, type: 'compound' as const, state: 'pending' as const })),
      ...proteins.map((name, i)  => ({ id: `protein-${i}`,  name, type: 'protein'  as const, state: 'pending' as const })),
      ...diseases.map((name, i)  => ({ id: `disease-${i}`,  name, type: 'disease'  as const, state: 'pending' as const })),
    ]
    setEntities(ents)

    const relations = nlp.relations ?? {}
    setCompoundRelations(
      (relations.chemicalTarget ?? p.compound_interacts_with_protein ?? []).map((e: any, i: number) => ({
        id: `cp-${i}`,
        source: e.compound ?? e.compound_name,
        sourceType: 'compound' as const,
        target: e.target ?? e.protein_name,
        targetType: 'protein' as const,
        relation: 'INTERACTÚA',
        confidence: e.confidence ?? e.confidence_score ?? 0,
        state: 'pending' as const,
      })),
    )

    setDiseaseRelations(
      (relations.targetDisease ?? p.compound_associated_with_disease ?? []).map((e: any, i: number) => ({
        id: `cd-${i}`,
        source: e.compound ?? e.compound_name,
        sourceType: 'compound' as const,
        target: e.disease ?? e.disease_name,
        targetType: 'disease' as const,
        relation: 'ASOCIADA',
        confidence: e.confidence ?? e.confidence_score ?? 0,
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
