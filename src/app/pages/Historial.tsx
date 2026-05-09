import React, { useState, useMemo } from 'react';
import { TopBar } from '../components/TopBar';
import { useNavigate } from 'react-router';
import {
  FileText, Search, CheckCircle, Clock, AlertCircle,
  ArrowRight, Download, Trash2, Filter,
} from 'lucide-react';

type Status = 'completado' | 'procesando' | 'error';

const historialData = [
  { id: '001', name: 'Espeletia_grandiflora_2024.pdf',   title: 'Neuroprotective effects of Espeletia grandiflora', date: '2025-05-07', entities: 14, relations: 6,  status: 'completado' as Status, size: '2.1 MB' },
  { id: '002', name: 'Uncaria_tomentosa_alkaloids.pdf',  title: 'Alkaloid profile of Uncaria tomentosa extracts',   date: '2025-05-06', entities: 21, relations: 9,  status: 'completado' as Status, size: '3.4 MB' },
  { id: '003', name: 'Passiflora_GABA_study.pdf',        title: 'GABA modulation by Passiflora incarnata',          date: '2025-05-04', entities: 9,  relations: 4,  status: 'completado' as Status, size: '1.8 MB' },
  { id: '004', name: 'Moringa_anti-inflam.pdf',          title: 'Anti-inflammatory properties of Moringa oleifera', date: '2025-05-02', entities: 17, relations: 8,  status: 'completado' as Status, size: '2.7 MB' },
  { id: '005', name: 'Curcuma_NF-kB_pathway.pdf',        title: 'Curcumin inhibition of NF-κB signaling',          date: '2025-04-30', entities: 22, relations: 11, status: 'completado' as Status, size: '4.1 MB' },
  { id: '006', name: 'Ginkgo_biloba_memory.pdf',         title: 'Cognitive effects of Ginkgo biloba extract',       date: '2025-04-28', entities: 18, relations: 7,  status: 'completado' as Status, size: '3.0 MB' },
  { id: '007', name: 'Camellia_EGCG_antioxidant.pdf',    title: 'Antioxidant mechanisms of EGCG in green tea',      date: '2025-04-25', entities: 13, relations: 5,  status: 'error'      as Status, size: '2.2 MB' },
  { id: '008', name: 'Valeriana_sleep_disorders.pdf',    title: 'Valeriana officinalis in sleep disorder treatment', date: '2025-04-22', entities: 0,  relations: 0,  status: 'procesando' as Status, size: '1.5 MB' },
];

const statusConfig: Record<Status, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  completado: { label: 'Completado', icon: <CheckCircle size={12} />, bg: '#E1F5EE', text: '#085041' },
  procesando: { label: 'Procesando', icon: <Clock size={12} />,       bg: '#EBF3FB', text: '#185FA5' },
  error:      { label: 'Error',      icon: <AlertCircle size={12} />, bg: '#FAECE7', text: '#D85A30' },
};

export function Historial() {
  const navigate = useNavigate();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'todos' | Status>('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return historialData.filter(item => {
      const matchStatus = filter === 'todos' || item.status === filter;
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.title.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [search, filter]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(i => i.id)));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  // Stats
  const completados = historialData.filter(i => i.status === 'completado').length;
  const totalEntities = historialData.filter(i => i.status === 'completado').reduce((s, i) => s + i.entities, 0);

  return (
    <>
      <TopBar
        title="Historial de análisis"
        subtitle="Registro de todos los artículos procesados"
        showExport={false}
        showProcess={false}
      />

      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#F4F4F2' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col gap-5">

          {/* ── Stats row ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total artículos',    value: historialData.length, color: '#185FA5', bg: 'rgba(24,95,165,0.08)'   },
              { label: 'Completados',        value: completados,          color: '#1D9E75', bg: 'rgba(29,158,117,0.08)'  },
              { label: 'Entidades extraídas',value: totalEntities,        color: '#7F77DD', bg: 'rgba(127,119,221,0.08)' },
              { label: 'Con errores',        value: historialData.filter(i => i.status === 'error').length, color: '#D85A30', bg: 'rgba(216,90,48,0.08)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E5E3', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                </div>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>{value}</p>
                <p style={{ fontSize: '11px', color: '#888780' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* ── Tabla ── */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {/* Toolbar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', gap: '12px' }}>

              {/* Búsqueda */}
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888780' }} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o título..."
                  style={{
                    width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
                    backgroundColor: '#F9F9F7', border: '1px solid #E5E5E3', borderRadius: '8px',
                    fontSize: '12px', color: '#444441', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#185FA5'}
                  onBlur={e => e.target.style.borderColor = '#E5E5E3'}
                />
              </div>

              {/* Filtro status */}
              <div className="flex items-center gap-1" style={{ padding: '3px', backgroundColor: '#F5F5F3', borderRadius: '8px', border: '1px solid #E5E5E3' }}>
                <Filter size={12} color="#888780" style={{ marginLeft: '6px' }} />
                {([['todos', 'Todos'], ['completado', 'Completados'], ['error', 'Errores']] as const).map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    style={{
                      padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: filter === val ? 700 : 400,
                      backgroundColor: filter === val ? '#FFFFFF' : 'transparent',
                      color: filter === val ? '#1A1A1A' : '#888780',
                      boxShadow: filter === val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Acciones bulk */}
              {selected.size > 0 && (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '11px', color: '#888780' }}>{selected.size} seleccionados</span>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', backgroundColor: '#FAECE7', color: '#D85A30', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              )}
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9F9F7', borderBottom: '1px solid #E5E5E3' }}>
                    <th className="px-4 py-3 text-left" style={{ width: '36px' }}>
                      <input type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        style={{ cursor: 'pointer', accentColor: '#185FA5' }}
                      />
                    </th>
                    {['Artículo', 'Fecha', 'Entidades', 'Relaciones', 'Estado', ''].map((col, i) => (
                      <th key={i} className="px-3 py-3 text-left"
                        style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888780', fontWeight: 700, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px', textAlign: 'center' }}>
                        <Search size={28} color="#D0D0CC" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: '13px', color: '#AAAAAA' }}>No se encontraron registros</p>
                      </td>
                    </tr>
                  ) : filtered.map((item, idx) => {
                    const sc = statusConfig[item.status];
                    const isSel = selected.has(item.id);
                    return (
                      <tr key={item.id}
                        className="hover:bg-[#F9F9F7] transition-colors"
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F5F5F3' : 'none', backgroundColor: isSel ? '#F0F6FD' : 'transparent' }}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelect(item.id)}
                            style={{ cursor: 'pointer', accentColor: '#185FA5' }} />
                        </td>

                        {/* Artículo */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: item.status === 'completado' ? '#E1F5EE' : item.status === 'error' ? '#FAECE7' : '#EBF3FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={16} color={item.status === 'completado' ? '#1D9E75' : item.status === 'error' ? '#D85A30' : '#185FA5'} />
                            </div>
                            <div className="min-w-0">
                              <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                                {item.title}
                              </p>
                              <p style={{ fontSize: '10px', color: '#888780' }}>{item.name} · {item.size}</p>
                            </div>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="px-3 py-3" style={{ fontSize: '12px', color: '#888780', whiteSpace: 'nowrap' }}>
                          {formatDate(item.date)}
                        </td>

                        {/* Entidades */}
                        <td className="px-3 py-3">
                          {item.entities > 0 ? (
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{item.entities}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#D0D0CC' }}>—</span>
                          )}
                        </td>

                        {/* Relaciones */}
                        <td className="px-3 py-3">
                          {item.relations > 0 ? (
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{item.relations}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#D0D0CC' }}>—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-3 py-3">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.text, fontSize: '11px', fontWeight: 600 }}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {item.status === 'completado' && (
                              <>
                                <button
                                  onClick={() => navigate('/app/nlp-results')}
                                  title="Ver resultados"
                                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E5E5E3', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#185FA5' }}>
                                  <ArrowRight size={13} />
                                </button>
                                <button
                                  title="Descargar JSON"
                                  style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E5E5E3', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888780' }}>
                                  <Download size={13} />
                                </button>
                              </>
                            )}
                            {item.status === 'error' && (
                              <button
                                title="Reintentar"
                                style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #F5C9BB', backgroundColor: '#FAECE7', color: '#D85A30', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                Reintentar
                              </button>
                            )}
                            {item.status === 'procesando' && (
                              <span style={{ fontSize: '11px', color: '#185FA5', fontStyle: 'italic' }}>En cola...</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F0EE', backgroundColor: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '11px', color: '#888780' }}>
                <strong style={{ color: '#1A1A1A' }}>{filtered.length}</strong> registros encontrados
              </p>
              <button
                onClick={() => navigate('/app')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: '#185FA5', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                + Nuevo análisis
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}