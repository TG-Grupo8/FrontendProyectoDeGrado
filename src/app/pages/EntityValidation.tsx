import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopBar } from '../components/TopBar';
import { EntityTag, EntityType } from '../components/EntityTag';
import { Check, X, ArrowRight, ChevronLeft } from 'lucide-react';

type ValidationState = 'pending' | 'accepted' | 'rejected';

interface Entity {
  id: string;
  name: string;
  type: EntityType;
  count: number;
  state: ValidationState;
}

const initialEntities: Entity[] = [
  // Compuestos
  { id: 'e1', name: 'Curcumin',   type: 'compound', count: 2, state: 'pending' },
  { id: 'e2', name: 'Curcuminoid',type: 'compound', count: 1, state: 'pending' },
  // Proteínas
  { id: 'e3', name: 'NF-κB',      type: 'protein',  count: 3, state: 'pending' },
  { id: 'e4', name: 'COX-2',      type: 'protein',  count: 2, state: 'pending' },
  { id: 'e5', name: 'iNOS',       type: 'protein',  count: 1, state: 'pending' },
  { id: 'e6', name: 'p53',        type: 'protein',  count: 1, state: 'pending' },
  { id: 'e7', name: 'caspase-3',  type: 'protein',  count: 1, state: 'pending' },
  { id: 'e8', name: 'VEGF',       type: 'protein',  count: 1, state: 'pending' },
  { id: 'e9', name: 'TNF-α',      type: 'protein',  count: 2, state: 'pending' },
  { id: 'e10',name: 'IL-6',       type: 'protein',  count: 1, state: 'pending' },
  // Enfermedades
  { id: 'e11',name: 'Cáncer',     type: 'disease',  count: 2, state: 'pending' },
];

const groups: { type: EntityType; label: string; color: string }[] = [
  { type: 'compound', label: 'Compuestos',  color: '#BA7517' },
  { type: 'protein',  label: 'Proteínas',   color: '#7F77DD' },
  { type: 'disease',  label: 'Enfermedades',color: '#D85A30' },
];

export function EntityValidation() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<Entity[]>(initialEntities);

  const updateState = (id: string, state: ValidationState) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, state } : e));
  };

  const acceptAll = (type: EntityType) => {
    setEntities(prev => prev.map(e => e.type === type ? { ...e, state: 'accepted' } : e));
  };

  const rejectAll = (type: EntityType) => {
    setEntities(prev => prev.map(e => e.type === type ? { ...e, state: 'rejected' } : e));
  };

  const accepted = entities.filter(e => e.state === 'accepted').length;
  const rejected = entities.filter(e => e.state === 'rejected').length;
  const pending  = entities.filter(e => e.state === 'pending').length;
  const allDone  = pending === 0;

  const stateStyles: Record<ValidationState, { bg: string; border: string }> = {
    pending:  { bg: '#FAFAFA',  border: '#E5E5E3' },
    accepted: { bg: '#F0FBF7',  border: '#C8EDE1' },
    rejected: { bg: '#FDF2EF',  border: '#F5C9BB' },
  };

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
                {entities.length - pending} de {entities.length} revisadas
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '6px', backgroundColor: '#F0F0EE', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((entities.length - pending) / entities.length) * 100}%`, backgroundColor: '#1D9E75', borderRadius: '6px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Grupos por tipo */}
          {groups.map(group => {
            const groupEntities = entities.filter(e => e.type === group.type);
            return (
              <div key={group.type} style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

                {/* Header del grupo */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: group.color }} />
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{group.label}</h3>
                    <span style={{ fontSize: '11px', color: '#888780' }}>({groupEntities.length})</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptAll(group.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#E1F5EE', color: '#085041', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <Check size={11} /> Aceptar todos
                    </button>
                    <button onClick={() => rejectAll(group.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#FAECE7', color: '#D85A30', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      <X size={11} /> Rechazar todos
                    </button>
                  </div>
                </div>

                {/* Entidades */}
                <div className="flex flex-col">
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
                onClick={() => navigate('/app/nlp-results/compound-relations')}
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