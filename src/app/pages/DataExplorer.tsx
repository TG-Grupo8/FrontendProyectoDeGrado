import React, { useState, useMemo } from 'react';
import { TopBar } from '../components/TopBar';
import { EntityTag } from '../components/EntityTag';
import { Search, ChevronLeft, ChevronRight, Download, Leaf, FlaskConical, Dna, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

const plantData = [
  { plant: 'Curcuma longa',        compound: 'Curcumina',           proteins: ['NF-κB', 'COX-2', 'p53'],    activity: 'Antiinflamatoria',  articles: 3 },
  { plant: 'Uncaria tomentosa',    compound: 'Alcaloides oxindól.', proteins: ['TNF-α', 'IL-6', 'NF-κB'],   activity: 'Inmunomoduladora',  articles: 2 },
  { plant: 'Espeletia grandiflora',compound: 'Espeletina',          proteins: ['AChE', 'MAO-B'],             activity: 'Neuroprotectora',   articles: 1, endemic: true },
  { plant: 'Passiflora incarnata', compound: 'Crisina',             proteins: ['GABA-A', 'GAD67'],           activity: 'Ansiolítica',       articles: 2, endemic: true },
  { plant: 'Moringa oleifera',     compound: 'Moringina',           proteins: ['PLA2', 'HO-1', '5-LOX'],    activity: 'Antiinflamatoria',  articles: 4 },
  { plant: 'Calendula officinalis',compound: 'Quercetina',          proteins: ['COX-1', 'COX-2'],           activity: 'Antiinflamatoria',  articles: 2 },
  { plant: 'Valeriana officinalis',compound: 'Ácido valerénico',    proteins: ['GABA-A', 'SERT'],           activity: 'Ansiolítica',       articles: 3 },
  { plant: 'Ginkgo biloba',        compound: 'Ginkgolida B',        proteins: ['PAF-R', 'MAO-A', 'MAO-B'], activity: 'Neuroprotectora',   articles: 5 },
  { plant: 'Camellia sinensis',    compound: 'EGCG',                proteins: ['Nrf2', 'HO-1', 'NF-κB'],   activity: 'Antioxidante',      articles: 6 },
  { plant: 'Zingiber officinale',  compound: 'Gingerol',            proteins: ['COX-2', 'TNF-α', '5-LOX'], activity: 'Antiinflamatoria',  articles: 3 },
  { plant: 'Bacopa monnieri',      compound: 'Bacoside A',          proteins: ['AChE', 'BDNF', 'SOD'],     activity: 'Neuroprotectora',   articles: 2 },
  { plant: 'Hypericum perforatum', compound: 'Hipericina',          proteins: ['SERT', 'DAT', 'NET'],      activity: 'Antidepresiva',     articles: 4 },
  { plant: 'Echinacea purpurea',   compound: 'Equinacósido',        proteins: ['TNF-α', 'IL-1β', 'IL-6'], activity: 'Inmunomoduladora',  articles: 2 },
  { plant: 'Rosmarinus officinalis',compound: 'Ácido rosmarínico', proteins: ['AChE', 'COX-2', 'Nrf2'],   activity: 'Antioxidante',      articles: 3 },
  { plant: 'Silybum marianum',     compound: 'Silibinina',          proteins: ['NF-κB', 'CYP3A4', 'p53'], activity: 'Hepatoprotectora',  articles: 2 },
];

const ACTIVITIES = ['Todas', 'Antiinflamatorias', 'Neuroprotectoras', 'Antioxidantes', 'Ansiolíticas', 'Inmunomoduladoras'];
const PAGE_SIZE  = 5;

const activityMap: Record<string, string> = {
  'Antiinflamatorias':  'Antiinflamatoria',
  'Neuroprotectoras':   'Neuroprotectora',
  'Antioxidantes':      'Antioxidante',
  'Ansiolíticas':       'Ansiolítica',
  'Inmunomoduladoras':  'Inmunomoduladora',
};

const activityColors: Record<string, { bg: string; text: string; dot: string }> = {
  'Todas':             { bg: '#185FA5', text: '#FFFFFF', dot: '#FFFFFF' },
  'Antiinflamatorias': { bg: '#FAECE7', text: '#D85A30', dot: '#D85A30' },
  'Neuroprotectoras':  { bg: '#EEEDFE', text: '#7F77DD', dot: '#7F77DD' },
  'Antioxidantes':     { bg: '#E1F5EE', text: '#1D9E75', dot: '#1D9E75' },
  'Ansiolíticas':      { bg: '#FEF3DC', text: '#BA7517', dot: '#BA7517' },
  'Inmunomoduladoras': { bg: '#EBF3FB', text: '#185FA5', dot: '#185FA5' },
};

const exportCSV = (data: typeof plantData) => {
  const header = 'Planta,Compuesto activo,Proteínas blanco,Actividad,Artículos';
  const rows   = data.map(r => `"${r.plant}","${r.compound}","${r.proteins.join('; ')}","${r.activity}",${r.articles}`);
  const blob   = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = 'plantas_medicinales.csv'; a.click();
  URL.revokeObjectURL(url);
};

const exportJSON = (data: typeof plantData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'plantas_medicinales.json'; a.click();
  URL.revokeObjectURL(url);
};

export function DataExplorer() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [searchQuery, setSearchQuery]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return plantData.filter(row => {
      const matchesActivity = activeFilter === 'Todas' || row.activity === activityMap[activeFilter];
      const matchesSearch   = !q || row.plant.toLowerCase().includes(q) || row.compound.toLowerCase().includes(q) || row.proteins.some(p => p.toLowerCase().includes(q)) || row.activity.toLowerCase().includes(q);
      return matchesActivity && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilter = (f: string) => { setActiveFilter(f); setCurrentPage(1); };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3)              return [1, 2, 3, '...', totalPages];
    if (safePage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', safePage, '...', totalPages];
  }, [totalPages, safePage]);

  // Stats dinámicas
  const stats = useMemo(() => ({
    total:     plantData.length,
    endemic:   plantData.filter(p => p.endemic).length,
    proteins:  [...new Set(plantData.flatMap(p => p.proteins))].length,
    articles:  plantData.reduce((s, p) => s + p.articles, 0),
  }), []);

  return (
    <>
      <TopBar
        title="Explorador de datos"
        subtitle="Repositorio de plantas medicinales procesadas"
        exportButtons={
          <div className="flex items-center gap-2">
            <button onClick={() => exportCSV(filtered)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D0D0CC', backgroundColor: '#FFFFFF', color: '#444441', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}>
              CSV <Download size={12} />
            </button>
            <button onClick={() => exportJSON(filtered)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D0D0CC', backgroundColor: '#FFFFFF', color: '#444441', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}>
              JSON <Download size={12} />
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#F4F4F2' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col gap-5">

          {/* ── Banner hero ── */}
          <div className="relative overflow-hidden p-6 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #0B3D2E 0%, #185FA5 100%)', borderRadius: '14px', minHeight: '100px' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '200px', width: '140px', height: '140px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', bottom: '-40px', right: '80px',  width: '180px', height: '180px', borderRadius: '50%', backgroundColor: 'rgba(29,158,117,0.15)' }} />
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={13} color="rgba(255,255,255,0.65)" />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Base de conocimiento fitoquímico
                </span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                Explora el repositorio de plantas medicinales
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Filtra por actividad biológica, busca por entidad o exporta los datos
              </p>
            </div>

            {/* Stats en el banner */}
            <div className="relative z-10 flex gap-5">
              {[
                { icon: <Leaf size={14} />, val: stats.total,    lbl: 'plantas'   },
                { icon: <Dna size={14} />,  val: stats.proteins, lbl: 'proteínas' },
                { icon: <FlaskConical size={14} />, val: stats.articles, lbl: 'artículos' },
              ].map(({ icon, val, lbl }) => (
                <div key={lbl} className="flex flex-col items-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '16px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{icon}</div>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>{val}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabla principal ── */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {/* Filtros y búsqueda */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0EE' }}>
              {/* Chips de actividad */}
              <div className="flex gap-2 flex-wrap mb-4">
                {ACTIVITIES.map(f => {
                  const active = activeFilter === f;
                  const colors = activityColors[f];
                  return (
                    <button key={f} onClick={() => handleFilter(f)}
                      style={{
                        padding: '5px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: active ? 700 : 500,
                        backgroundColor: active ? colors.bg : '#F5F5F3',
                        color: active ? colors.text : '#888780',
                        transition: 'all 0.15s',
                        boxShadow: active ? `0 1px 4px ${colors.bg}40` : 'none',
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>

              {/* Búsqueda */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888780' }} />
                <input
                  type="text" value={searchQuery} onChange={handleSearch}
                  placeholder="Buscar planta, compuesto o proteína..."
                  style={{
                    width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '9px', paddingBottom: '9px',
                    backgroundColor: '#F9F9F7', border: '1px solid #E5E5E3',
                    borderRadius: '8px', fontSize: '13px', color: '#444441',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#185FA5'}
                  onBlur={e => e.target.style.borderColor = '#E5E5E3'}
                />
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9F9F7', borderBottom: '1px solid #E5E5E3' }}>
                    {['Planta', 'Compuesto activo', 'Proteínas blanco', 'Actividad', 'Artículos'].map((col, i) => (
                      <th key={col} className={`px-4 py-3 ${i === 4 ? 'text-center' : 'text-left'}`}
                        style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888780', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                        <Search size={28} color="#D0D0CC" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: '13px', color: '#AAAAAA' }}>No se encontraron resultados</p>
                      </td>
                    </tr>
                  ) : paginated.map((row, idx) => (
                    <tr key={idx}
                      className="hover:bg-[#F9F9F7] transition-colors"
                      style={{ borderBottom: '1px solid #F5F5F3', cursor: 'pointer' }}
                      onClick={() => navigate('/app/nlp-results')}
                    >
                      {/* Planta */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Leaf size={14} color="#1D9E75" />
                          </div>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', fontStyle: 'italic', display: 'block' }}>
                              {row.plant}
                            </span>
                            {row.endemic && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#085041', backgroundColor: '#E1F5EE', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                🇨🇴 Endémica
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Compuesto */}
                      <td className="px-4 py-3">
                        <EntityTag type="compound" label={row.compound} size="sm" showDot={false} />
                      </td>

                      {/* Proteínas */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {row.proteins.map((p, pIdx) => (
                            <EntityTag key={pIdx} type="protein" label={p} size="sm" showDot={false} />
                          ))}
                        </div>
                      </td>

                      {/* Actividad */}
                      <td className="px-4 py-3">
                        <EntityTag type="plant" label={row.activity} size="sm" showDot={false} />
                      </td>

                      {/* Artículos */}
                      <td className="px-4 py-3 text-center">
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%',
                          backgroundColor: row.articles >= 4 ? 'rgba(24,95,165,0.1)' : '#F5F5F3',
                          color: row.articles >= 4 ? '#185FA5' : '#888780',
                          fontSize: '12px', fontWeight: 700,
                        }}>
                          {row.articles}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA' }}>
              <div style={{ fontSize: '11px', color: '#888780' }}>
                Mostrando <strong style={{ color: '#1A1A1A' }}>{filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</strong> de <strong style={{ color: '#1A1A1A' }}>{filtered.length}</strong> plantas
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #E5E5E3', backgroundColor: '#FFFFFF', color: safePage === 1 ? '#D0D0CC' : '#444441', cursor: safePage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={14} />
                </button>
                {pageNumbers.map((page, idx) => (
                  <button key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    style={{
                      width: '30px', height: '30px', borderRadius: '6px', border: 'none', cursor: page === '...' ? 'default' : 'pointer',
                      backgroundColor: page === safePage ? '#185FA5' : 'transparent',
                      color: page === safePage ? '#FFFFFF' : '#444441',
                      fontSize: '12px', fontWeight: page === safePage ? 700 : 400,
                    }}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #E5E5E3', backgroundColor: '#FFFFFF', color: safePage === totalPages ? '#D0D0CC' : '#444441', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}