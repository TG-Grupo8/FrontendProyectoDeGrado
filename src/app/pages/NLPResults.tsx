import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopBar } from '../components/TopBar';
import {
  FileText, CheckCircle, Clock, ArrowRight,
  Search, Dna, FlaskConical, AlertCircle,
} from 'lucide-react';

type FileStatus = 'pendiente' | 'procesado';

interface ArchivoItem {
  id: string;
  name: string;
  title: string;
  date: string;
  status: FileStatus;
  entities?: number;
  relations?: number;
}

const archivos: ArchivoItem[] = [
  { id: '1', name: 'Espeletia_grandiflora_2024.pdf',  title: 'Neuroprotective effects of Espeletia grandiflora', date: '2025-05-07', status: 'pendiente',  entities: 14, relations: 6  },
  { id: '2', name: 'Uncaria_tomentosa_alkaloids.pdf', title: 'Alkaloid profile of Uncaria tomentosa extracts',   date: '2025-05-06', status: 'pendiente',  entities: 21, relations: 9  },
  { id: '3', name: 'Passiflora_GABA_study.pdf',       title: 'GABA modulation by Passiflora incarnata',          date: '2025-05-04', status: 'procesado',  entities: 9,  relations: 4  },
  { id: '4', name: 'Moringa_anti-inflam.pdf',         title: 'Anti-inflammatory properties of Moringa oleifera', date: '2025-05-02', status: 'procesado',  entities: 17, relations: 8  },
  { id: '5', name: 'Curcuma_NF-kB_pathway.pdf',       title: 'Curcumin inhibition of NF-κB signaling',          date: '2025-04-30', status: 'pendiente',  entities: 22, relations: 11 },
];

const statusConfig: Record<FileStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  pendiente: { label: 'Pendiente de validar', icon: <Clock size={12} />,        bg: '#FEF3DC', text: '#BA7517', border: '#F5DFA0' },
  procesado: { label: 'Validado',             icon: <CheckCircle size={12} />,  bg: '#E1F5EE', text: '#085041', border: '#A8E6CF' },
};

export function NLPResults() {
  const navigate  = useNavigate();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'todos' | FileStatus>('todos');

  const filtered = archivos.filter(a => {
    const matchFilter = filter === 'todos' || a.status === filter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendientes = archivos.filter(a => a.status === 'pendiente').length;
  const procesados = archivos.filter(a => a.status === 'procesado').length;

  return (
    <>
      <TopBar
        title="Resultados NLP"
        subtitle="Selecciona un archivo para validar sus entidades y relaciones"
        showExport={false}
        showProcess={false}
      />

      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#F4F4F2' }}>
        <div className="max-w-[900px] mx-auto flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total archivos',       value: archivos.length, color: '#185FA5', bg: 'rgba(24,95,165,0.08)'  },
              { label: 'Pendientes de validar',value: pendientes,      color: '#BA7517', bg: 'rgba(186,117,23,0.08)' },
              { label: 'Validados',            value: procesados,      color: '#1D9E75', bg: 'rgba(29,158,117,0.08)' },
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

          {/* Lista de archivos */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {/* Toolbar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888780' }} />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar archivo..."
                  style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#F9F9F7', border: '1px solid #E5E5E3', borderRadius: '8px', fontSize: '12px', color: '#444441', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#185FA5'}
                  onBlur={e => e.target.style.borderColor = '#E5E5E3'}
                />
              </div>

              {/* Filtro */}
              <div className="flex items-center gap-1" style={{ padding: '3px', backgroundColor: '#F5F5F3', borderRadius: '8px', border: '1px solid #E5E5E3' }}>
                {([['todos', 'Todos'], ['pendiente', 'Pendientes'], ['procesado', 'Validados']] as const).map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    style={{
                      padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
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
            </div>

            {/* Items */}
            {filtered.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Search size={28} color="#D0D0CC" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: '13px', color: '#AAAAAA' }}>No se encontraron archivos</p>
              </div>
            ) : filtered.map((archivo, idx) => {
              const sc = statusConfig[archivo.status];
              const isPending = archivo.status === 'pendiente';
              return (
                <div
                  key={archivo.id}
                  onClick={() => navigate('/app/nlp-results/entities')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', cursor: 'pointer',
                    borderBottom: idx < filtered.length - 1 ? '1px solid #F5F5F3' : 'none',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F9F9F7'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'}
                >
                  {/* Icono */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                    backgroundColor: isPending ? 'rgba(186,117,23,0.1)' : 'rgba(29,158,117,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={20} color={isPending ? '#BA7517' : '#1D9E75'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                        {archivo.title}
                      </p>
                    </div>
                    <p style={{ fontSize: '11px', color: '#888780', marginBottom: '8px' }}>
                      {archivo.name} · {archivo.date}
                    </p>

                    {/* Mini stats + badge */}
                    <div className="flex items-center gap-3">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.text, fontSize: '11px', fontWeight: 600, border: `1px solid ${sc.border}` }}>
                        {sc.icon} {sc.label}
                      </span>
                      {archivo.entities !== undefined && (
                        <>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888780' }}>
                            <Dna size={11} color="#7F77DD" /> {archivo.entities} entidades
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888780' }}>
                            <FlaskConical size={11} color="#1D9E75" /> {archivo.relations} relaciones
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      padding: '7px 14px', borderRadius: '8px',
                      backgroundColor: isPending ? '#185FA5' : '#F0F0EE',
                      color: isPending ? '#FFFFFF' : '#888780',
                      fontSize: '12px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {isPending ? 'Validar' : 'Ver detalle'}
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div style={{ padding: '12px 16px', backgroundColor: '#F0F6FD', border: '1px solid #D8E8F8', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={14} color="#185FA5" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: '#185FA5' }}>
              Los archivos <strong>pendientes</strong> requieren validación antes de ser guardados en el grafo de conocimiento.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}