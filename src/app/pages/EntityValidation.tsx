import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { TopBar } from '../components/TopBar';
import { EntityTag, EntityType } from '../components/EntityTag';
import { Check, X, ArrowRight, ChevronLeft } from 'lucide-react';
import { jobsApi } from '../lib/api';
import { useValidation } from '../context/ValidationContext';

type ValidationState = 'pending' | 'accepted' | 'rejected';

type ConcreteEntityType = 'plant' | 'compound' | 'protein' | 'disease';

interface Entity {
  id: string;
  name: string;
  type: ConcreteEntityType;
  score?: number;
  count: number;
  state: ValidationState;
}

type ScoreFilterType = Exclude<ConcreteEntityType, 'plant'>;

const groups: { type: ConcreteEntityType; label: string; color: string }[] = [
  { type: 'plant',    label: 'Plantas',     color: '#1D9E75' },
  { type: 'compound', label: 'Compuestos',  color: '#BA7517' },
  { type: 'protein',  label: 'Proteínas',   color: '#7F77DD' },
  { type: 'disease',  label: 'Enfermedades',color: '#D85A30' },
];

export function EntityValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const jobId = (location.state as { jobId?: string } | null)?.jobId ?? null;
  const { loadFromPayload, entities: ctxEntities, setEntities: setCtxEntities, setJobId } = useValidation();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadError, setLoadError] = useState('');
  const [scoreFilters, setScoreFilters] = useState<Record<ScoreFilterType, number>>({
    compound: 0,
    protein: 0,
    disease: 0,
  });

  useEffect(() => {
    if (!jobId) { setLoadError('No se especificó un job. Vuelve a Resultados NLP.'); return; }
    setJobId(jobId);
    jobsApi.result(jobId).then(r => {
      if (r.preliminary_result) {
        loadFromPayload(jobId, r.preliminary_result);
      } else {
        setLoadError('Este job no tiene resultado preliminar disponible.');
      }
    }).catch(() => setLoadError('Error al cargar el resultado del job.'));
  }, [jobId]);

  useEffect(() => {
    if (ctxEntities.length > 0) {
      setEntities(ctxEntities.map(e => ({ id: e.id, name: e.name, type: e.type, score: e.score, count: 1, state: e.state })));
    }
  }, [ctxEntities]);

  const isVisibleByScore = (entity: Entity) => (
    entity.type === 'plant' || (entity.score ?? 1) >= scoreFilters[entity.type]
  );

  const visibleEntities = entities.filter(isVisibleByScore);

  const updateState = (id: string, state: ValidationState) => {
    const entity = entities.find(e => e.id === id);
    let next = entities.map(e => e.id === id ? { ...e, state } : e);
    // Solo puede haber una planta aceptada: si se acepta una, rechazar las demás
    if (entity?.type === 'plant' && state === 'accepted') {
      next = next.map(e => e.type === 'plant' && e.id !== id ? { ...e, state: 'rejected' as ValidationState } : e);
    }
    setEntities(next);
    setCtxEntities(next);
  };

  const acceptAll = (type: ConcreteEntityType) => {
    const next = entities.map(e => e.type === type && isVisibleByScore(e) ? { ...e, state: 'accepted' as ValidationState } : e);
    setEntities(next);
    setCtxEntities(next);
  };

  const rejectAll = (type: ConcreteEntityType) => {
    const next = entities.map(e => e.type === type && isVisibleByScore(e) ? { ...e, state: 'rejected' as ValidationState } : e);
    setEntities(next);
    setCtxEntities(next);
  };

  const accepted = visibleEntities.filter(e => e.state === 'accepted').length;
  const rejected = visibleEntities.filter(e => e.state === 'rejected').length;
  const pending  = visibleEntities.filter(e => e.state === 'pending').length;
  const allDone  = pending === 0;
  const totalVisible = visibleEntities.length;
  const reviewedVisible = totalVisible - pending;

  const stateStyles: Record<ValidationState, { bg: string; border: string }> = {
    pending:  { bg: '#FAFAFA',  border: '#E5E5E3' },
    accepted: { bg: '#F0FBF7',  border: '#C8EDE1' },
    rejected: { bg: '#FDF2EF',  border: '#F5C9BB' },
  };

  if (loadError) return (
    <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: '#F4F4F2' }}>
      <p style={{ color: '#D85A30', fontSize: '13px' }}>⚠ {loadError}</p>
    </div>
  );

  if (entities.length === 0) return (
    <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: '#F4F4F2' }}>
      <p style={{ color: '#888780', fontSize: '13px' }}>Cargando entidades...</p>
    </div>
  );

  return (
    <>
      <TopBar
        title="Paso 1 — Validar entidades"
        subtitle="Acepta o rechaza cada entidad extraída del artículo"
        showExport={false}
        showProcess={false}
      />

      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#F4F4F2' }}>
        <div className="max-w-[900px] mx-auto flex flex-col gap-5">

          {/* Progress bar */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E5E3', padding: '16px 20px' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: 600 }}>✓ {accepted} aceptadas</span>
                <span style={{ fontSize: '12px', color: '#D85A30', fontWeight: 600 }}>✗ {rejected} rechazadas</span>
                <span style={{ fontSize: '12px', color: '#888780' }}>⏳ {pending} pendientes</span>
              </div>
              <span style={{ fontSize: '11px', color: '#888780' }}>
                {reviewedVisible} de {totalVisible} revisadas
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '6px', backgroundColor: '#F0F0EE', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalVisible ? (reviewedVisible / totalVisible) * 100 : 0}%`, backgroundColor: '#1D9E75', borderRadius: '6px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Grupos por tipo */}
          {groups.map(group => {
            const allGroupEntities = entities.filter(e => e.type === group.type);
            const groupEntities = allGroupEntities.filter(isVisibleByScore);
            const hasScoreFilter = group.type !== 'plant';
            const filterType = group.type as ScoreFilterType;
            return (
              <div key={group.type} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

                {/* Header del grupo */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', backgroundColor: '#FAFAFA' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: group.color }} />
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{group.label}</h3>
                    <span style={{ fontSize: '11px', color: '#888780' }}>
                      ({hasScoreFilter ? `${groupEntities.length}/${allGroupEntities.length}` : groupEntities.length})
                    </span>
                    {group.type === 'plant' && (
                      <span style={{ fontSize: '11px', color: '#BA7517', fontWeight: 600 }}>
                        — Únicamente se puede escoger una planta válida
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {hasScoreFilter && (
                      <div className="flex items-center gap-2">
                        <label style={{ fontSize: '11px', color: '#666660', whiteSpace: 'nowrap' }}>
                          Score min. {Math.round(scoreFilters[filterType] * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={scoreFilters[filterType]}
                          onChange={(event) => setScoreFilters(prev => ({
                            ...prev,
                            [filterType]: Number(event.target.value),
                          }))}
                          style={{ width: '120px', accentColor: group.color }}
                        />
                      </div>
                    )}
                    {group.type !== 'plant' && (
                      <button onClick={() => acceptAll(group.type)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#E1F5EE', color: '#085041', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        <Check size={11} /> Aceptar todos
                      </button>
                    )}
                    <button onClick={() => rejectAll(group.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#FAECE7', color: '#D85A30', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <X size={11} /> Rechazar todos
                    </button>
                  </div>
                </div>

                {/* Entidades */}
                <div className="flex flex-col">
                  {groupEntities.length === 0 && (
                    <div style={{ padding: '14px 20px', fontSize: '12px', color: '#888780' }}>
                      No hay entidades visibles con el score minimo actual.
                    </div>
                  )}
                  {groupEntities.map((entity, idx) => {
                    const style = stateStyles[entity.state];
                    return (
                      <div key={entity.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '12px 20px',
                          backgroundColor: style.bg,
                          borderBottom: idx < groupEntities.length - 1 ? '1px solid #F5F5F3' : 'none',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {/* Checkbox visual */}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => updateState(entity.id, entity.state === 'accepted' ? 'pending' : 'accepted')}
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                              backgroundColor: entity.state === 'accepted' ? '#1D9E75' : '#F0F0EE',
                              color: entity.state === 'accepted' ? '#FFFFFF' : '#AAAAAA',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => updateState(entity.id, entity.state === 'rejected' ? 'pending' : 'rejected')}
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                              backgroundColor: entity.state === 'rejected' ? '#D85A30' : '#F0F0EE',
                              color: entity.state === 'rejected' ? '#FFFFFF' : '#AAAAAA',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Entidad */}
                        <div className="flex-1 flex items-center gap-3">
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', fontStyle: entity.type === 'plant' ? 'italic' : 'normal' }}>
                            {entity.name}
                          </span>
                          <EntityTag type={entity.type} label={entity.type} size="sm" showDot={false} />
                          <span style={{ fontSize: '11px', color: '#AAAAAA' }}>{entity.count}x en el texto</span>
                          {entity.score !== undefined && (
                            <span style={{ fontSize: '11px', color: '#666660' }}>
                              score {(entity.score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        {/* Badge estado */}
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                          backgroundColor: entity.state === 'accepted' ? '#E1F5EE' : entity.state === 'rejected' ? '#FAECE7' : '#F0F0EE',
                          color: entity.state === 'accepted' ? '#085041' : entity.state === 'rejected' ? '#D85A30' : '#AAAAAA',
                        }}>
                          {entity.state === 'accepted' ? 'Aceptada' : entity.state === 'rejected' ? 'Rechazada' : 'Pendiente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Navegación */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/app/nlp-results')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#FFFFFF', color: '#444441', border: '1px solid #D0D0CC', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <ChevronLeft size={15} /> Volver
            </button>
            <div className="flex items-center gap-3">
              {!allDone && (
                <span style={{ fontSize: '12px', color: '#888780' }}>{pending} entidades sin revisar</span>
              )}
              <button
                onClick={() => navigate('/app/nlp-results/compound-relations', { state: { jobId } })}
                disabled={!allDone}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                  backgroundColor: allDone ? '#185FA5' : '#D0D0CC',
                  color: '#FFFFFF', border: 'none', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 600,
                  cursor: allDone ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}
              >
                Siguiente: Relaciones Compuesto → Proteína <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
