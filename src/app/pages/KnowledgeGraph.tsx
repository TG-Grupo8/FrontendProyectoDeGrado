import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { EntityTag, EntityType } from '../components/EntityTag';
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { graphApi } from '../lib/api';

interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  color: string;
}

const RELATION_COLORS: Record<string, string> = {
  PLANT_HAS_COMPOUND:                '#1D9E75',
  COMPOUND_INTERACTS_WITH_PROTEIN:   '#7F77DD',
  COMPOUND_ASSOCIATED_WITH_DISEASE:  '#D85A30',
};

const NODE_COLORS: Record<EntityType, { fill: string; stroke: string; text: string }> = {
  plant:    { fill: '#E1F5EE', stroke: '#1D9E75', text: '#085041' },
  protein:  { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489' },
  compound: { fill: '#FAEEDA', stroke: '#BA7517', text: '#633806' },
  disease:  { fill: '#FAECE7', stroke: '#D85A30', text: '#993C1D' },
  all:      { fill: '#F0F0EE', stroke: '#888780', text: '#444441' },
};

const NODE_RADIUS = 36;

function positionNodes(
  entities: { name: string; type: EntityType }[]
): GraphNode[] {
  const byType: Record<string, { name: string; type: EntityType }[]> = {
    plant: [], compound: [], protein: [], disease: [],
  };
  entities.forEach(e => { byType[e.type]?.push(e); });

  const rings: { key: string; type: EntityType; r: number }[] = [
    { key: 'plant',    type: 'plant',    r: 130 },
    { key: 'compound', type: 'compound', r: 270 },
    { key: 'protein',  type: 'protein',  r: 400 },
    { key: 'disease',  type: 'disease',  r: 510 },
  ];

  const cx = 400, cy = 310;
  const result: GraphNode[] = [];

  rings.forEach(({ key, type, r }) => {
    const group = byType[key] ?? [];
    group.forEach((e, i) => {
      const angle = (2 * Math.PI * i) / (group.length || 1) - Math.PI / 2;
      result.push({ id: e.name, label: e.name, type, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  });

  return result;
}

export function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom]               = useState(1);
  const [pan, setPan]                 = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning]     = useState(false);
  const [panStart, setPanStart]       = useState({ x: 0, y: 0 });
  const [selected, setSelected]       = useState<string | null>(null);
  const [hovered, setHovered]         = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<EntityType>>(
    new Set(['plant', 'protein', 'compound', 'disease'])
  );
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load data from API ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [plantRes, compoundRes, proteinRes, diseaseRes] = await Promise.all([
          graphApi.entities('plant',    undefined, 15),
          graphApi.entities('compound', undefined, 30),
          graphApi.entities('protein',  undefined, 25),
          graphApi.entities('disease',  undefined, 10),
        ]);

        if (cancelled) return;

        const allEntities = [
          ...plantRes.items.map(e => ({ name: e.name, type: 'plant'    as EntityType })),
          ...compoundRes.items.map(e => ({ name: e.name, type: 'compound' as EntityType })),
          ...proteinRes.items.map(e => ({ name: e.name, type: 'protein'  as EntityType })),
          ...diseaseRes.items.map(e => ({ name: e.name, type: 'disease'  as EntityType })),
        ];

        const positioned = positionNodes(allEntities);
        if (!cancelled) setNodes(positioned);

        // Load neighborhoods from plants (depth=2) and compounds (depth=1) to get all edge types
        const neighborResults = await Promise.allSettled([
          ...plantRes.items.map(p => graphApi.neighbors('plant', p.name, 2)),
          ...compoundRes.items.map(c => graphApi.neighbors('compound', c.name, 1)),
        ]);

        if (cancelled) return;

        const edgeSet = new Set<string>();
        const newEdges: GraphEdge[] = [];

        for (const result of neighborResults) {
          if (result.status === 'rejected') continue;
          for (const e of result.value.edges) {
            const key = `${e.from_name}→${e.relation_type}→${e.to_name}`;
            if (edgeSet.has(key)) continue;
            edgeSet.add(key);
            newEdges.push({
              source: e.from_name,
              target: e.to_name,
              label: e.relation_type,
              color: RELATION_COLORS[e.relation_type] ?? '#888780',
            });
          }
        }

        if (!cancelled) setEdges(newEdges);
      } catch {
        // silently fail — show empty graph
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const selectedNode = nodes.find(n => n.id === selected);
  const hoveredNode  = nodes.find(n => n.id === hovered);

  const visibleNodes = nodes.filter(n => activeTypes.has(n.type));
  const visibleIds   = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

  const connectedIds = selected
    ? new Set(edges.filter(e => e.source === selected || e.target === selected).flatMap(e => [e.source, e.target]))
    : null;

  // ── Zoom ──────────────────────────────────────────────────
  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.2, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));
  const handleReset   = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelected(null); };

  // ── Pan ───────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.node')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  // ── Wheel zoom ────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.4), 2.5));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Toggle filtro ─────────────────────────────────────────
  const toggleType = (type: EntityType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else next.add(type);
      return next;
    });
  };

  const edgeMidpoint = (src: GraphNode, tgt: GraphNode) => ({
    x: (src.x + tgt.x) / 2,
    y: (src.y + tgt.y) / 2,
  });

  const edgePoints = (src: GraphNode, tgt: GraphNode) => {
    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    return {
      x1: src.x + ux * NODE_RADIUS, y1: src.y + uy * NODE_RADIUS,
      x2: tgt.x - ux * (NODE_RADIUS + 10), y2: tgt.y - uy * (NODE_RADIUS + 10),
    };
  };

  return (
    <>
      <TopBar
        title="Grafo de conocimiento"
        subtitle="Relaciones entre entidades biomédicas extraídas"
        showExport={true}
        showProcess={false}
      />

      <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: '#F4F4F2' }}>

        {/* ── Canvas SVG ── */}
        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: 'rgba(244,244,242,0.7)' }}>
              <p style={{ fontSize: '13px', color: '#888780' }}>Cargando grafo...</p>
            </div>
          )}
          {!loading && nodes.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Filter size={22} color="#CCCCCC" />
              </div>
              <p style={{ fontSize: '13px', color: '#AAAAAA' }}>El grafo de conocimiento está vacío</p>
              <p style={{ fontSize: '11px', color: '#CCCCCC' }}>Valida artículos para poblar el grafo</p>
            </div>
          )}
          <svg
            ref={svgRef}
            width="100%" height="100%"
            style={{ cursor: isPanning ? 'grabbing' : 'grab', display: 'block' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={e => { if ((e.target as SVGElement).tagName === 'svg') setSelected(null); }}
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#CCCCCC" />
              </marker>
              {Object.entries(NODE_COLORS).map(([type, c]) => (
                <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={c.stroke} />
                </marker>
              ))}
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E5E3" strokeWidth="0.5" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

              {/* ── Aristas ── */}
              {visibleEdges.map((edge, idx) => {
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;
                const { x1, y1, x2, y2 } = edgePoints(src, tgt);
                const mid = edgeMidpoint(src, tgt);
                const isHighlighted = !selected || (selected === edge.source || selected === edge.target);
                return (
                  <g key={idx} style={{ opacity: isHighlighted ? 1 : 0.08, transition: 'opacity 0.2s' }}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isHighlighted ? edge.color : '#CCCCCC'}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                      markerEnd="url(#arrow)"
                    />
                    {isHighlighted && (
                      <g>
                        <rect x={mid.x - 24} y={mid.y - 9} width="48" height="16" rx="4" fill="white" stroke={edge.color} strokeWidth="1" opacity="0.95" />
                        <text x={mid.x} y={mid.y + 3} textAnchor="middle"
                          style={{ fontSize: '7px', fontWeight: 700, fill: edge.color, fontFamily: 'monospace' }}>
                          {edge.label.replace(/_/g, ' ')}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ── Nodos ── */}
              {visibleNodes.map(node => {
                const colors  = NODE_COLORS[node.type];
                const isSel   = selected === node.id;
                const isConn  = connectedIds ? connectedIds.has(node.id) : true;
                const isHov   = hovered === node.id;
                const opacity = selected && !isConn ? 0.15 : 1;
                const r       = isSel ? NODE_RADIUS + 6 : isHov ? NODE_RADIUS + 3 : NODE_RADIUS;

                return (
                  <g
                    key={node.id}
                    className="node"
                    style={{ cursor: 'pointer', opacity, transition: 'opacity 0.2s' }}
                    onClick={e => { e.stopPropagation(); setSelected(selected === node.id ? null : node.id); }}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {(isSel || isHov) && (
                      <circle cx={node.x} cy={node.y} r={r + 8} fill={colors.stroke} opacity="0.12" />
                    )}
                    <circle
                      cx={node.x} cy={node.y} r={r}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSel ? 3 : 1.5}
                      style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
                    />
                    <text
                      x={node.x} y={node.y - 4}
                      textAnchor="middle"
                      style={{ fontSize: node.label.length > 10 ? '9px' : '10px', fontWeight: 700, fill: colors.text, fontFamily: 'system-ui', pointerEvents: 'none' }}
                    >
                      {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                    </text>
                    <text
                      x={node.x} y={node.y + 10}
                      textAnchor="middle"
                      style={{ fontSize: '8px', fill: colors.stroke, fontFamily: 'system-ui', opacity: 0.8, pointerEvents: 'none' }}
                    >
                      {node.type}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* ── Controles zoom ── */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { icon: <ZoomIn size={15} />, action: handleZoomIn,  title: 'Acercar'      },
              { icon: <ZoomOut size={15} />, action: handleZoomOut, title: 'Alejar'       },
              { icon: <Maximize2 size={15} />, action: handleReset, title: 'Restablecer' },
            ].map(({ icon, action, title }) => (
              <button key={title} onClick={action} title={title}
                style={{
                  width: '34px', height: '34px', borderRadius: '8px',
                  backgroundColor: '#FFFFFF', border: '1px solid #E5E5E3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#444441', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                {icon}
              </button>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #E5E5E3', borderRadius: '6px', fontSize: '11px', color: '#888780' }}>
            {Math.round(zoom * 100)}%
          </div>

          {hoveredNode && !selected && (
            <div style={{
              position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#1A1A1A', color: '#FFFFFF',
              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              {hoveredNode.label} · {hoveredNode.type}
            </div>
          )}
        </div>

        {/* ── Panel lateral ── */}
        <div style={{ width: '280px', flexShrink: 0, backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E5E3', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Filtros */}
          <div style={{ padding: '16px', borderBottom: '1px solid #F0F0EE' }}>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={13} color="#888780" />
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A' }}>Filtrar por tipo</h3>
            </div>
            <div className="flex flex-col gap-2">
              {(['plant', 'protein', 'compound', 'disease'] as EntityType[]).map(type => {
                const colors = NODE_COLORS[type];
                const active = activeTypes.has(type);
                const count  = nodes.filter(n => n.type === type).length;
                return (
                  <button key={type} onClick={() => toggleType(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      backgroundColor: active ? colors.fill : '#F5F5F3',
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: active ? colors.stroke : '#CCCCCC', flexShrink: 0, transition: 'background-color 0.15s' }} />
                    <span style={{ fontSize: '12px', flex: 1, color: active ? colors.text : '#888780', fontWeight: active ? 600 : 400, textTransform: 'capitalize' }}>
                      {type === 'plant' ? 'Plantas' : type === 'protein' ? 'Proteínas' : type === 'compound' ? 'Compuestos' : 'Enfermedades'}
                    </span>
                    <span style={{ fontSize: '10px', color: active ? colors.stroke : '#CCCCCC', fontWeight: 600 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: '16px', borderBottom: '1px solid #F0F0EE' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>Estadísticas</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nodos',      value: visibleNodes.length,                       color: '#185FA5' },
                { label: 'Relaciones', value: visibleEdges.length,                       color: '#1D9E75' },
                { label: 'Plantas',    value: nodes.filter(n => n.type === 'plant').length,    color: '#1D9E75' },
                { label: 'Proteínas',  value: nodes.filter(n => n.type === 'protein').length,  color: '#7F77DD' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '10px', backgroundColor: '#F9F9F7', borderRadius: '8px', border: '1px solid #F0F0EE' }}>
                  <p style={{ fontSize: '18px', fontWeight: 700, color, marginBottom: '2px' }}>{value}</p>
                  <p style={{ fontSize: '10px', color: '#888780' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detalle nodo seleccionado */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {!selectedNode ? (
              <div style={{ paddingTop: '20px', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Filter size={18} color="#CCCCCC" />
                </div>
                <p style={{ fontSize: '12px', color: '#AAAAAA', lineHeight: '1.6' }}>
                  Haz clic en un nodo para ver sus relaciones y detalles
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: NODE_COLORS[selectedNode.type].stroke, flexShrink: 0 }} />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', fontStyle: selectedNode.type === 'plant' ? 'italic' : 'normal' }}>
                    {selectedNode.label}
                  </h3>
                </div>
                <EntityTag type={selectedNode.type} label={selectedNode.type} size="sm" showDot={false} />

                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888780', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '10px' }}>
                    Relaciones ({edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, idx) => {
                      const isSource  = edge.source === selectedNode.id;
                      const otherId   = isSource ? edge.target : edge.source;
                      const otherNode = nodes.find(n => n.id === otherId);
                      if (!otherNode) return null;
                      const otherColors = NODE_COLORS[otherNode.type];
                      return (
                        <div key={idx} style={{ padding: '10px', backgroundColor: '#F9F9F7', borderRadius: '8px', border: '1px solid #F0F0EE' }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span style={{ fontSize: '9px', fontWeight: 700, color: edge.color, backgroundColor: `${edge.color}18`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${edge.color}30` }}>
                              {isSource ? '→' : '←'} {edge.label.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelected(otherId)}
                            style={{ fontSize: '12px', fontWeight: 600, color: otherColors.text, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontStyle: otherNode.type === 'plant' ? 'italic' : 'normal' }}
                          >
                            {otherNode.label}
                          </button>
                          <p style={{ fontSize: '10px', color: '#AAAAAA', marginTop: '2px', textTransform: 'capitalize' }}>{otherNode.type}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Leyenda */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0EE', backgroundColor: '#FAFAFA' }}>
            <p style={{ fontSize: '10px', color: '#888780', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Leyenda</p>
            <div className="flex flex-col gap-1.5">
              {([
                { label: 'Planta → Compuesto',          color: '#1D9E75' },
                { label: 'Compuesto → Proteína',         color: '#7F77DD' },
                { label: 'Compuesto → Enfermedad',       color: '#D85A30' },
              ] as const).map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div style={{ width: '24px', height: '2px', backgroundColor: color }} />
                  <span style={{ fontSize: '10px', color: '#888780' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
