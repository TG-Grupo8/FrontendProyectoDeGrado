import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopBar } from '../components/TopBar';
import { EntityTag, EntityType } from '../components/EntityTag';
import { Check, X, ChevronLeft, CheckCircle, Download } from 'lucide-react';

type ValidationState = 'pending' | 'accepted' | 'rejected';

interface Relation {
  id: string;
  source: string;
  sourceType: EntityType;
  relation: string;
  target: string;
  targetType: EntityType;
  confidence: number;
  state: ValidationState;
}

const initialRelations: Relation[] = [
  { id: 'd1', source: 'Cáncer', sourceType: 'disease', relation: 'INVOLUCRA', target: 'NF-κB',    targetType: 'protein', confidence: 0.95, state: 'pending' },
  { id: 'd2', source: 'Cáncer', sourceType: 'disease', relation: 'EXPRESA',   target: 'COX-2',    targetType: 'protein', confidence: 0.91, state: 'pending' },
  { id: 'd3', source: 'Cáncer', sourceType: 'disease', relation: 'SUPRIME',   target: 'p53',      targetType: 'protein', confidence: 0.94, state: 'pending' },
];

const relationColors: Record<string, string> = {
  INVOLUCRA: '#D85A30', EXPRESA: '#7F77DD', SUPRIME: '#993C1D',
};

export function DiseaseRelations() {
  const navigate = useNavigate();
  const [relations, setRelations] = useState<Relation[]>(initialRelations);
  const [saved, setSaved]         = useState(false);

  const updateState = (id: string, state: ValidationState) => {
    setRelations(prev => prev.map(r => r.id === id ? { ...r, state } : r));
  };

  const acceptAll = () => setRelations(prev => prev.map(r => ({ ...r, state: 'accepted' })));
  const rejectAll = () => setRelations(prev => prev.map(r => ({ ...r, state: 'rejected' })));

  const accepted = relations.filter(r => r.state === 'accepted').length;
  const rejected = relations.filter(r => r.state === 'rejected').length;
  const pending  = relations.filter(r => r.state === 'pending').length;
  const allDone  = pending === 0;

  const handleSave = () => setSaved(true);

  return (
    <>
      <TopBar
        title="Paso 3 — Relaciones Enfermedad → Proteína"
        subtitle="Valida las relaciones entre enfermedades y proteínas"
        showExport={false}
        showProcess={false}
      />

      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#F4F4F2' }}>
        <div className="max-w-[900px] mx-auto flex flex-col gap-5">

          {/* Progress */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E5E3', padding: '16px 20px' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 600 }}>✓ {accepted} aceptadas</span>
                <span style={{ fontSize: '12px', color: '#D85A30', fontWeight: 600 }}>✗ {rejected} rechazadas</span>
                <span style={{ fontSize: '12px', color: '#888780' }}>⏳ {pending} pendientes</span>
              </div>
              <span style={{ fontSize: '11px', color: '#888780' }}>{relations.length - pending} de {relations.length} revisadas</span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '6px', backgroundColor: '#F0F0EE', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((relations.length - pending) / relations.length) * 100}%`, backgroundColor: '#1D9E75', borderRadius: '6px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Tabla */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D85A30' }} />
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>Relaciones identificadas</h3>
                <span style={{ fontSize: '11px', color: '#888780' }}>({relations.length})</span>
              </div>
              <div className="flex gap-2">
                <button onClick={acceptAll}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#E1F5EE', color: '#085041', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  <Check size={11} /> Aceptar todas
                </button>
                <button onClick={rejectAll}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#FAECE7', color: '#D85A30', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  <X size={11} /> Rechazar todas
                </button>
              </div>
            </div>

            {relations.map((rel, idx) => {
              const relColor = relationColors[rel.relation] ?? '#888780';
              const bgColor  = rel.state === 'accepted' ? '#F0FBF7' : rel.state === 'rejected' ? '#FDF2EF' : '#FAFAFA';
              const border   = rel.state === 'accepted' ? '#C8EDE1' : rel.state === 'rejected' ? '#F5C9BB' : '#F5F5F3';
              return (
                <div key={rel.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 20px', backgroundColor: bgColor,
                  borderBottom: idx < relations.length - 1 ? `1px solid ${border}` : 'none',
                  transition: 'background-color 0.2s',
                }}>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => updateState(rel.id, rel.state === 'accepted' ? 'pending' : 'accepted')}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: rel.state === 'accepted' ? '#1D9E75' : '#F0F0EE', color: rel.state === 'accepted' ? '#FFFFFF' : '#AAAAAA', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => updateState(rel.id, rel.state === 'rejected' ? 'pending' : 'rejected')}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: rel.state === 'rejected' ? '#D85A30' : '#F0F0EE', color: rel.state === 'rejected' ? '#FFFFFF' : '#AAAAAA', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex-1 flex items-center gap-3 flex-wrap">
                    <EntityTag type={rel.sourceType} label={rel.source} size="sm" showDot={false} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '20px', height: '1px', backgroundColor: '#D0D0CC' }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: relColor, backgroundColor: `${relColor}18`, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${relColor}30` }}>
                        {rel.relation}
                      </span>
                      <div style={{ width: '20px', height: '1px', backgroundColor: '#D0D0CC' }} />
                    </div>
                    <EntityTag type={rel.targetType} label={rel.target} size="sm" showDot={false} />
                    <span style={{ fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace' }}>
                      {(rel.confidence * 100).toFixed(0)}% confianza
                    </span>
                  </div>

                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', flexShrink: 0,
                    backgroundColor: rel.state === 'accepted' ? '#E1F5EE' : rel.state === 'rejected' ? '#FAECE7' : '#F0F0EE',
                    color: rel.state === 'accepted' ? '#085041' : rel.state === 'rejected' ? '#D85A30' : '#AAAAAA',
                  }}>
                    {rel.state === 'accepted' ? 'Aceptada' : rel.state === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Banner éxito al guardar */}
          {saved && (
            <div style={{ padding: '16px 20px', backgroundColor: '#F0FBF7', border: '1px solid #C8EDE1', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} color="#1D9E75" style={{ flexShrink: 0 }} />
              <div className="flex-1">
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#085041', marginBottom: '2px' }}>¡Validación completada!</p>
                <p style={{ fontSize: '12px', color: '#1D9E75' }}>Los resultados han sido guardados y están disponibles en el grafo de conocimiento.</p>
              </div>
              <button onClick={() => navigate('/app/knowledge-graph')}
                style={{ padding: '8px 14px', backgroundColor: '#1D9E75', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ver grafo →
              </button>
            </div>
          )}

          {/* Navegación */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/app/nlp-results/compound-relations')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#FFFFFF', color: '#444441', border: '1px solid #D0D0CC', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <ChevronLeft size={15} /> Volver
            </button>

            {!saved ? (
              <div className="flex items-center gap-3">
                {!allDone && <span style={{ fontSize: '12px', color: '#888780' }}>{pending} relaciones sin revisar</span>}
                <button
                  onClick={handleSave}
                  disabled={!allDone}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: allDone ? '#1D9E75' : '#D0D0CC', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: allDone ? 'pointer' : 'not-allowed' }}>
                  <CheckCircle size={15} /> Guardar y finalizar
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/app/historial')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: '#185FA5', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <Download size={15} /> Ver en historial
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}