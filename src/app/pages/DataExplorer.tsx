import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { Search, ChevronLeft, ChevronRight, Download, Leaf, FlaskConical, Dna, Sparkles, Heart, Loader2, ArrowRight } from 'lucide-react';
import { graphApi } from '../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type RelKey = 'planta-enfermedad' | 'planta-compuesto' | 'planta-proteina' | 'compuesto-proteina' | 'proteina-enfermedad';

interface RelOption {
  key: RelKey;
  label: string;
  fromType: string;
  toType: string;
  queryFromType: string;
  queryToType: string;
  depth: number;
  fromLabel: string;
  toLabel: string;
}

interface RelRow {
  source: string;
  targets: string[];
  articles: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Plant→Disease: no direct edge. Path traversed is Plant→Compound→Disease (depth=2).
const REL_OPTIONS: RelOption[] = [
  { key: 'planta-enfermedad',  label: 'Planta → Enfermedad',  fromType: 'plant',    toType: 'disease',  queryFromType: 'plant',    queryToType: 'disease',  depth: 2, fromLabel: 'Planta',    toLabel: 'Enfermedades asociadas' },
  { key: 'planta-compuesto',   label: 'Planta → Compuesto',   fromType: 'plant',    toType: 'compound', queryFromType: 'plant',    queryToType: 'compound', depth: 1, fromLabel: 'Planta',    toLabel: 'Compuestos activos'     },
  { key: 'planta-proteina',    label: 'Planta → Proteína',    fromType: 'plant',    toType: 'protein',  queryFromType: 'plant',    queryToType: 'protein',  depth: 2, fromLabel: 'Planta',    toLabel: 'Proteínas blanco'       },
  { key: 'compuesto-proteina', label: 'Compuesto → Proteína', fromType: 'compound', toType: 'protein',  queryFromType: 'compound', queryToType: 'protein',  depth: 1, fromLabel: 'Compuesto', toLabel: 'Proteínas blanco'       },
  { key: 'proteina-enfermedad',label: 'Proteína → Enfermedad',fromType: 'protein',  toType: 'disease',  queryFromType: 'protein',  queryToType: 'disease',  depth: 1, fromLabel: 'Proteína',  toLabel: 'Enfermedades asociadas' },
];

const PAGE_SIZE = 5;

const NODE_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  plant:    { bg: '#E1F5EE', text: '#085041', border: '#B6E8D4', icon: <Leaf    size={13} color="#1D9E75" /> },
  compound: { bg: '#EEF4FF', text: '#1A3A6E', border: '#C7D9F8', icon: <FlaskConical size={13} color="#185FA5" /> },
  protein:  { bg: '#EEEDFE', text: '#4B40C8', border: '#D0CEFC', icon: <Dna     size={13} color="#7F77DD" /> },
  disease:  { bg: '#FEECEC', text: '#9B1515', border: '#F8C4C4', icon: <Heart   size={13} color="#C0392B" /> },
};

// ── Exports ───────────────────────────────────────────────────────────────────

const exportCSV = (rows: RelRow[], opt: RelOption) => {
  const header = `"${opt.fromLabel}","${opt.toLabel}","Artículos"`;
  const lines  = rows.map(r => `"${r.source}","${r.targets.join('; ')}",${r.articles}`);
  const blob   = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href = url; a.download = `relaciones_${opt.key}.csv`; a.click();
  URL.revokeObjectURL(url);
};

const exportJSON = (rows: RelRow[], opt: RelOption) => {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = `relaciones_${opt.key}.json`; a.click();
  URL.revokeObjectURL(url);
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DataExplorer() {
  const [relKey,      setRelKey]      = useState<RelKey>('planta-enfermedad');
  const [rows,        setRows]        = useState<RelRow[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const relOpt = REL_OPTIONS.find(r => r.key === relKey)!;

  // Load data whenever relationship type changes
  useEffect(() => {
    let cancelled = false;
    setRows([]);
    setLoading(true);
    setCurrentPage(1);

    if (relKey === 'planta-enfermedad') {
      // The KnowledgeGraph shows plant→disease paths as plant→compound→disease.
      // Depth=2 from a plant only finds diseases if the SAME compound connects
      // both that plant and a disease — which is often not the case in practice.
      // Pivot through compounds instead: query every compound at depth=1 to find
      // which plants AND diseases share a compound, then build the plant→disease map.
      graphApi.entities('compound', undefined, 200)
        .then(res => {
          if (cancelled) return;
          return Promise.all(
            res.items.map(c =>
              graphApi.neighbors('compound', c.name, 1)
                .then(nbr => {
                  // PLANT_HAS_COMPOUND: Plant→Compound → plant is from_name
                  const plants = nbr.edges
                    .filter(e => e.relation_type === 'PLANT_HAS_COMPOUND')
                    .map(e => e.from_name);
                  // COMPOUND_ASSOCIATED_WITH_DISEASE: Compound→Disease → disease is to_name
                  const diseases = nbr.edges
                    .filter(e => e.relation_type === 'COMPOUND_ASSOCIATED_WITH_DISEASE')
                    .map(e => e.to_name);
                  const articles = new Set(
                    nbr.edges
                      .filter(e => e.relation_type === 'COMPOUND_ASSOCIATED_WITH_DISEASE')
                      .map(e => e.source_id).filter(Boolean)
                  ).size;
                  return { plants, diseases, articles };
                })
                .catch(() => ({ plants: [] as string[], diseases: [] as string[], articles: 0 }))
            )
          );
        })
        .then(results => {
          if (cancelled || !results) return;
          const plantMap: Record<string, Set<string>> = {};
          const artMap:   Record<string, number>      = {};
          for (const { plants, diseases, articles } of results) {
            if (!plants.length || !diseases.length) continue;
            for (const plant of plants) {
              if (!plantMap[plant]) { plantMap[plant] = new Set(); artMap[plant] = 0; }
              diseases.forEach(d => plantMap[plant].add(d));
              artMap[plant] = Math.max(artMap[plant], articles);
            }
          }
          setRows(
            Object.entries(plantMap).map(([src, tgts]) => ({
              source: src, targets: [...tgts], articles: artMap[src],
            }))
          );
          setLoading(false);
        })
        .catch(() => { if (!cancelled) setLoading(false); });

    } else {
      const opt = REL_OPTIONS.find(r => r.key === relKey)!;
      graphApi.entities(opt.queryFromType, undefined, 100)
        .then(res => {
          if (cancelled) return;
          const entities = res.items.slice(0, 60);
          return Promise.all(
            entities.map(e =>
              graphApi.neighbors(opt.queryFromType, e.name, opt.depth)
                .then(nbr => {
                  if (cancelled) return null;
                  const targetNames = [
                    ...new Set(
                      nbr.nodes
                        .filter(n => n.node_type === opt.queryToType)
                        .map(n => n.name)
                    ),
                  ];
                  const articleCount = new Set(
                    nbr.edges.map(ed => ed.source_id).filter(Boolean)
                  ).size;
                  return { querySource: e.name, queryTargets: targetNames, articles: articleCount };
                })
                .catch(() => null)
            )
          );
        })
        .then(results => {
          if (cancelled || !results) return;
          const built = (results.filter(Boolean) as { querySource: string; queryTargets: string[]; articles: number }[])
            .filter(r => r.queryTargets.length > 0)
            .map(r => ({ source: r.querySource, targets: r.queryTargets, articles: r.articles }));
          setRows(built);
          setLoading(false);
        })
        .catch(() => { if (!cancelled) setLoading(false); });
    }

    return () => { cancelled = true; };
  }, [relKey]);

  // Filtering & pagination
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      r.source.toLowerCase().includes(q) ||
      r.targets.some(t => t.toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); };
  const handleRelKey = (k: RelKey) => { setRelKey(k); setSearchQuery(''); setCurrentPage(1); };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3)              return [1, 2, 3, '...', totalPages];
    if (safePage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', safePage, '...', totalPages];
  }, [totalPages, safePage]);

  const stats = useMemo(() => ({
    sources:   rows.length,
    targets:   new Set(rows.flatMap(r => r.targets)).size,
    relations: rows.reduce((s, r) => s + r.targets.length, 0),
  }), [rows]);

  const fromColors = NODE_COLORS[relOpt.fromType];
  const toColors   = NODE_COLORS[relOpt.toType];

  return (
    <>
      <TopBar
        title="Explorador de datos"
        subtitle="Relaciones fitoquímicas extraídas del grafo de conocimiento"
        exportButtons={
          <div className="flex items-center gap-2">
            <button onClick={() => exportCSV(filtered, relOpt)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D0D0CC', backgroundColor: '#FFFFFF', color: '#444441', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}>
              CSV <Download size={12} />
            </button>
            <button onClick={() => exportJSON(filtered, relOpt)}
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
                {relOpt.fromLabel} <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> {relOpt.toLabel}
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                Relaciones extraídas automáticamente de artículos científicos
              </p>
            </div>

            {/* Stats */}
            <div className="relative z-10 flex gap-5">
              {[
                { icon: fromColors.icon, val: loading ? '…' : stats.sources,   lbl: relOpt.fromLabel.toLowerCase() + 's' },
                { icon: toColors.icon,   val: loading ? '…' : stats.targets,   lbl: 'entidades' },
                { icon: <ArrowRight size={14} color="rgba(255,255,255,0.5)" />, val: loading ? '…' : stats.relations, lbl: 'relaciones' },
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

            {/* Selector de tipo de relación */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0EE' }}>
              <p style={{ fontSize: '10px', color: '#888780', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '10px' }}>
                Tipo de relación
              </p>
              <div className="flex gap-2 flex-wrap mb-4">
                {REL_OPTIONS.map(opt => {
                  const active = relKey === opt.key;
                  return (
                    <button key={opt.key} onClick={() => handleRelKey(opt.key)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: active ? 700 : 500,
                        border: active ? 'none' : '1px solid #E5E5E3',
                        backgroundColor: active ? '#185FA5' : '#F9F9F7',
                        color: active ? '#FFFFFF' : '#555550',
                        transition: 'all 0.15s',
                        boxShadow: active ? '0 1px 6px rgba(24,95,165,0.3)' : 'none',
                      }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Búsqueda */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888780' }} />
                <input
                  type="text" value={searchQuery} onChange={handleSearch}
                  placeholder={`Buscar ${relOpt.fromLabel.toLowerCase()} o ${relOpt.toLabel.toLowerCase()}...`}
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
                    {[relOpt.fromLabel, relOpt.toLabel, 'Artículos'].map((col, i) => (
                      <th key={col}
                        className={`px-4 py-3 ${i === 2 ? 'text-center' : 'text-left'}`}
                        style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888780', fontWeight: 700, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '48px', textAlign: 'center' }}>
                        <Loader2 size={24} color="#185FA5" style={{ margin: '0 auto 10px', display: 'block', animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: '13px', color: '#888780' }}>Cargando relaciones del grafo…</p>
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '48px', textAlign: 'center' }}>
                        <Search size={28} color="#D0D0CC" style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: '13px', color: '#AAAAAA' }}>
                          {rows.length === 0 ? 'No se encontraron relaciones en el grafo' : 'No hay resultados para esta búsqueda'}
                        </p>
                      </td>
                    </tr>
                  ) : paginated.map((row, idx) => (
                    <tr key={idx}
                      className="hover:bg-[#F9F9F7] transition-colors"
                      style={{ borderBottom: '1px solid #F5F5F3' }}
                    >
                      {/* Source entity */}
                      <td className="px-4 py-3" style={{ minWidth: '180px' }}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: fromColors.bg, border: `1px solid ${fromColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {fromColors.icon}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', fontStyle: relOpt.fromType === 'plant' ? 'italic' : 'normal' }}>
                            {row.source}
                          </span>
                        </div>
                      </td>

                      {/* Target entities */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {row.targets.map((t, tIdx) => (
                            <span key={tIdx} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                              backgroundColor: toColors.bg, color: toColors.text, border: `1px solid ${toColors.border}`,
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Articles count */}
                      <td className="px-4 py-3 text-center">
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%',
                          backgroundColor: row.articles >= 3 ? 'rgba(24,95,165,0.1)' : '#F5F5F3',
                          color: row.articles >= 3 ? '#185FA5' : '#888780',
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
                Mostrando{' '}
                <strong style={{ color: '#1A1A1A' }}>
                  {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                </strong>{' '}
                de <strong style={{ color: '#1A1A1A' }}>{filtered.length}</strong> {relOpt.fromLabel.toLowerCase()}s
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
                      width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                      cursor: page === '...' ? 'default' : 'pointer',
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
