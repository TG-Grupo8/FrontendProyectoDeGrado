import React, { createContext, useContext, useState } from 'react'
import type { GraphPayload } from '../lib/api'

type EntityState = 'pending' | 'accepted' | 'rejected'

export interface ValidatedEntity {
  id: string
  name: string
  type: 'plant' | 'compound' | 'protein' | 'disease'
  score?: number
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
  evidence?: string
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
  loadFromPayload: (jobId: string, payload: GraphPayload | PipelineResultPayload) => void
  buildAcceptedGraph: () => GraphPayload
  reset: () => void
}

const ValidationContext = createContext<ValidationContextValue | null>(null)

interface PipelineResultPayload {
  nlp?: {
    plant?: { name?: string | null }
    plants?: { plant?: string }[]
    chemicals?: { compound?: string; score?: number }[]
    targets?: { target?: string; score?: number }[]
    diseases?: { disease?: string; score?: number }[]
    relations?: {
      chemicalTarget?: { compound?: string; target?: string; verb?: string; phrase?: string }[]
      targetDisease?: { protein?: string; disease?: string; verb?: string; phrase?: string }[]
    }
  }
}

function uniqueEntities<T>(
  items: T[],
  nameOf: (item: T) => string | null | undefined,
  scoreOf: (item: T) => number | undefined,
) {
  const byName = new Map<string, { name: string; score?: number }>()
  for (const item of items) {
    const name = nameOf(item)?.trim()
    if (!name) continue
    const score = scoreOf(item)
    const existing = byName.get(name)
    if (!existing || (score ?? 0) > (existing.score ?? 0)) {
      byName.set(name, { name, score })
    }
  }
  return Array.from(byName.values())
}

function normalizePayload(payload: GraphPayload | PipelineResultPayload): GraphPayload {
  if (!('nlp' in payload) || !payload.nlp) return payload as GraphPayload

  const nlp = payload.nlp
  const plants = uniqueEntities(
    [...(nlp.plants ?? []), { plant: nlp.plant?.name ?? undefined }],
    item => item.plant,
    () => undefined,
  )
  const compounds = uniqueEntities(nlp.chemicals ?? [], item => item.compound, item => item.score)
  const proteins = uniqueEntities(nlp.targets ?? [], item => item.target, item => item.score)
  const diseases = uniqueEntities(nlp.diseases ?? [], item => item.disease, item => item.score)

  return {
    plants,
    compounds,
    proteins,
    diseases,
    plant_has_compound: plants.flatMap(plant =>
      compounds.map(compound => ({
        plant_name: plant.name,
        compound_name: compound.name,
        confidence_score: 1,
      }))
    ),
    compound_interacts_with_protein: (nlp.relations?.chemicalTarget ?? [])
      .filter(edge => edge.compound && edge.target)
      .map(edge => ({
        compound_name: edge.compound as string,
        protein_name: edge.target as string,
        confidence_score: 1,
      })),
    compound_associated_with_disease: [],
    protein_associated_with_disease: (nlp.relations?.targetDisease ?? [])
      .filter(edge => edge.protein && edge.disease)
      .map(edge => ({
        protein_name: edge.protein as string,
        disease_name: edge.disease as string,
        confidence_score: 1,
      })),
  }
}

export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [entities, setEntities] = useState<ValidatedEntity[]>([])
  const [compoundRelations, setCompoundRelations] = useState<ValidatedRelation[]>([])
  const [diseaseRelations, setDiseaseRelations] = useState<ValidatedRelation[]>([])

  const loadFromPayload = (id: string, payload: GraphPayload | PipelineResultPayload) => {
    setJobId(id)
    const p = normalizePayload(payload)

    const ents: ValidatedEntity[] = [
      ...p.plants.map((n, i) => ({ id: `plant-${i}`, name: n.name, type: 'plant' as const, score: n.score, state: 'pending' as const })),
      ...p.compounds.map((n, i) => ({ id: `compound-${i}`, name: n.name, type: 'compound' as const, score: n.score, state: 'pending' as const })),
      ...p.proteins.map((n, i) => ({ id: `protein-${i}`, name: n.name, type: 'protein' as const, score: n.score, state: 'pending' as const })),
      ...p.diseases.map((n, i) => ({ id: `disease-${i}`, name: n.name, type: 'disease' as const, score: n.score, state: 'pending' as const })),
    ]
    setEntities(ents)

    // Build an evidence lookup from the raw pipeline payload (if available)
    const rawNlp = ('nlp' in payload && payload.nlp) ? payload.nlp as PipelineResultPayload['nlp'] : null
    const chemEvidence = new Map<string, { phrase?: string; verb?: string }>()
    const disEvidence  = new Map<string, { phrase?: string; verb?: string }>()
    if (rawNlp?.relations?.chemicalTarget) {
      for (const r of rawNlp.relations.chemicalTarget) {
        if (r.compound && r.target && (r.phrase || r.verb))
          chemEvidence.set(`${r.compound}||${r.target}`, { phrase: r.phrase, verb: r.verb })
      }
    }
    if (rawNlp?.relations?.targetDisease) {
      for (const r of rawNlp.relations.targetDisease) {
        if (r.protein && r.disease && (r.phrase || r.verb))
          disEvidence.set(`${r.protein}||${r.disease}`, { phrase: r.phrase, verb: r.verb })
      }
    }

    setCompoundRelations(
      p.compound_interacts_with_protein.map((e, i) => {
        const evidence = chemEvidence.get(`${e.compound_name}||${e.protein_name}`)
        return {
          id: `cp-${i}`,
          source: e.compound_name,
          sourceType: 'compound' as const,
          target: e.protein_name,
          targetType: 'protein' as const,
          relation: evidence?.verb ?? 'INTERACTÚA',
          confidence: e.confidence_score,
          state: 'pending' as const,
          evidence: evidence?.phrase,
        }
      }),
    )

    setDiseaseRelations([
      ...p.compound_associated_with_disease.map((e, i) => ({
        id: `cd-${i}`,
        source: e.compound_name,
        sourceType: 'compound' as const,
        target: e.disease_name,
        targetType: 'disease' as const,
        relation: 'ASOCIADA',
        confidence: e.confidence_score,
        state: 'pending' as const,
      })),
      ...p.protein_associated_with_disease.map((e, i) => {
        const evidence = disEvidence.get(`${e.protein_name}||${e.disease_name}`)
        return {
          id: `pd-${i}`,
          source: e.protein_name,
          sourceType: 'protein' as const,
          target: e.disease_name,
          targetType: 'disease' as const,
          relation: evidence?.verb ?? 'ASOCIADA',
          confidence: e.confidence_score,
          state: 'pending' as const,
          evidence: evidence?.phrase,
        }
      }),
    ])
  }

  const buildAcceptedGraph = (): GraphPayload => {
    const accepted = entities.filter(e => e.state === 'accepted')
    const acceptedPlants = accepted.filter(e => e.type === 'plant')
    const acceptedCompounds = accepted.filter(e => e.type === 'compound')
    return {
      plants: acceptedPlants.map(e => ({ name: e.name })),
      compounds: acceptedCompounds.map(e => ({ name: e.name })),
      proteins: accepted.filter(e => e.type === 'protein').map(e => ({ name: e.name })),
      diseases: accepted.filter(e => e.type === 'disease').map(e => ({ name: e.name })),
      plant_has_compound: acceptedPlants.flatMap(plant =>
        acceptedCompounds.map(compound => ({
          plant_name: plant.name,
          compound_name: compound.name,
          confidence_score: 1,
        }))
      ),
      compound_interacts_with_protein: compoundRelations
        .filter(r => r.state === 'accepted')
        .map(r => ({ compound_name: r.source, protein_name: r.target, confidence_score: r.confidence })),
      compound_associated_with_disease: diseaseRelations
        .filter(r => r.state === 'accepted' && r.sourceType === 'compound')
        .map(r => ({ compound_name: r.source, disease_name: r.target, confidence_score: r.confidence })),
      protein_associated_with_disease: diseaseRelations
        .filter(r => r.state === 'accepted' && r.sourceType === 'protein')
        .map(r => ({ protein_name: r.source, disease_name: r.target, confidence_score: r.confidence })),
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
