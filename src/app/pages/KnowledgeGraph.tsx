import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { EntityTag, EntityType } from '../components/EntityTag';
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';

// ── Datos del grafo ───────────────────────────────────────────
const NODES = [
  { id: 'curcumin',       label: 'Curcumin',        type: 'compound' as EntityType, x: 400, y: 280 },
  { id: 'curcuma',        label: 'Curcuma longa',   type: 'plant'    as EntityType, x: 180, y: 160 },
  { id: 'nfkb',          label: 'NF-κB',           type: 'protein'  as EntityType, x: 600, y: 140 },
  { id: 'cox2',          label: 'COX-2',           type: 'protein'  as EntityType, x: 660, y: 300 },
  { id: 'inos',          label: 'iNOS',            type: 'protein'  as EntityType, x: 580, y: 430 },
  { id: 'p53',           label: 'p53',             type: 'protein'  as EntityType, x: 260, y: 420 },
  { id: 'caspase3',      label: 'caspase-3',       type: 'protein'  as EntityType, x: 160, y: 320 },
  { id: 'vegf',          label: 'VEGF receptors',  type: 'protein'  as EntityType, x: 440, y: 450 },
  { id: 'uncaria',       label: 'Uncaria tomentosa',type: 'plant'   as EntityType, x: 240, y: 80  },
  { id: 'tnfalpha',      label: 'TNF-α',           type: 'protein'  as EntityType, x: 500, y: 80  },
];

const EDGES = [
  { source: 'curcuma',  target: 'curcumin', label: 'PRODUCE',    color: '#1D9E75' },
  { source: 'curcumin', target: 'nfkb',     label: 'INHIBE',     color: '#D85A30' },
  { source: 'curcumin', target: 'cox2',     label: 'SUPRIME',    color: '#993C1D' },
  { source: 'curcumin', target: 'inos',     label: 'SUPRIME',    color: '#993C1D' },
  { source: 'curcumin', target: 'p53',      label: 'MODULA',     color: '#185FA5' },
  { source: 'curcumin', target: 'caspase3', label: 'ACTIVA',     color: '#1D9E75' },
  { source: 'curcumin', target: 'vegf',     label: 'INTERACTÚA', color: '#7F77DD' },
  { source: 'nfkb',    target: 'cox2',     label: 'REGULA',     color: '#BA7517' },
  { source: 'uncaria',  target: 'tnfalpha', label: 'INHIBE',     color: '#D85A30' },
];

const NODE_COLORS: Record<EntityType, { fill: string; stroke: string; text: string }> = {
  plant:    { fill: '#E1F5EE', stroke: '#1D9E75', text: '#085041' },
  protein:  { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489' },
  compound: { fill: '#FAEEDA', stroke: '#BA7517', text: '#633806' },
  disease:  { fill: '#FAECE7', stroke: '#D85A30', text: '#993C1D' },
  all:      { fill: '#F0F0EE', stroke: '#888780', text: '#444441' },
};

const NODE_RADIUS = 36;

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

  const selectedNode = NODES.find(n => n.id === selected);
  const hoveredNode  = NODES.find(n => n.id === hovered);

  // Nodos y aristas visibles según filtro
  const visibleNodes = NODES.filter(n => activeTypes.has(n.type));
  const visibleIds   = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = EDGES.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

  // Nodos conectados al seleccionado
  const connectedIds = selected
    ? new Set(EDGES.filter(e => e.source === selected || e.target === selected).flatMap(e => [e.source, e.target]))
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

  // ── Calcular punto medio de arista para label ─────────────
  const edgeMidpoint = (src: typeof NODES[0], tgt: typeof NODES[0]) => ({
    x: (src.x + tgt.x) / 2,
    y: (src.y + tgt.y) / 2,
  });

  // ── Arista: punto de inicio/fin en borde del nodo ────────
  const edgePoints = (src: typeof NODES[0], tgt: typeof NODES[0]) => {
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
              {/* Flecha */}
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#CCCCCC" />
              </marker>
              {Object.entries(NODE_COLORS).map(([type, c]) => (
                <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={c.stroke} />
                </marker>
              ))}
              {/* Fondo grid */}
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E5E3" strokeWidth="0.5" />
              </pattern>
            </defs>

            {/* Fondo grid */}
            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

              {/* ── Aristas ── */}
              {visibleEdges.map((edge, idx) => {
                const src = NODES.find(n => n.id === edge.source)!;
                const tgt = NODES.find(n => n.id === edge.target)!;
                const { x1, y1, x2, y2 } = edgePoints(src, tgt);
                const mid = edgeMidpoint(src, tgt);
                const isHighlighted = !selected || (selected === edge.source || selected === edge.target);
                return (
                  <g key={idx} style={{ opacity: isHighlighted ? 1 : 0.08, transition: 'opacity 0.2s' }}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isHighlighted ? edge.color : '#CCCCCC'}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                      strokeDasharray={edge.label === 'INTERACTÚA' ? '5 3' : 'none'}
                      markerEnd={`url(#arrow)`}
                    />
                    {/* Label de relación */}
                    {isHighlighted && (
                      <g>
                        <rect
                          x={mid.x - 24} y={mid.y - 9} width="48" height="16" rx="4"
                          fill="white" stroke={edge.color} strokeWidth="1" opacity="0.95"
                        />
                        <text x={mid.x} y={mid.y + 3} textAnchor="middle"
                          style={{ fontSize: '8px', fontWeight: 700, fill: edge.color, fontFamily: 'monospace' }}>
                          {edge.label}
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
                    {/* Halo selección */}
                    {(isSel || isHov) && (
                      <circle cx={node.x} cy={node.y} r={r + 8}
                        fill={colors.stroke} opacity="0.12" />
                    )}
                    {/* Círculo principal */}
                    <circle
                      cx={node.x} cy={node.y} r={r}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSel ? 3 : 1.5}
                      style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
                    />
                    {/* Label */}
                    <text
                      x={node.x} y={node.y - 4}
                      textAnchor="middle"
                      style={{ fontSize: node.label.length > 10 ? '9px' : '10px', fontWeight: 700, fill: colors.text, fontFamily: 'system-ui', pointerEvents: 'none' }}
                    >
                      {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                    </text>
                    {/* Tipo */}
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
              { icon: <ZoomIn size={15} />, action: handleZoomIn,  title: 'Acercar'  },
              { icon: <ZoomOut size={15} />, action: handleZoomOut, title: 'Alejar'   },
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

          {/* ── Zoom indicator ── */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #E5E5E3', borderRadius: '6px', fontSize: '11px', color: '#888780' }}>
            {Math.round(zoom * 100)}%
          </div>

          {/* ── Tooltip hover ── */}
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
                const colors  = NODE_COLORS[type];
                const active  = activeTypes.has(type);
                const count   = NODES.filter(n => n.type === type).length;
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
                { label: 'Nodos',     value: visibleNodes.length,      color: '#185FA5' },
                { label: 'Relaciones', value: visibleEdges.length,     color: '#1D9E75' },
                { label: 'Plantas',   value: NODES.filter(n => n.type === 'plant').length,    color: '#1D9E75' },
                { label: 'Proteínas', value: NODES.filter(n => n.type === 'protein').length,  color: '#7F77DD' },
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
                    Relaciones ({EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, idx) => {
                      const isSource   = edge.source === selectedNode.id;
                      const otherId    = isSource ? edge.target : edge.source;
                      const otherNode  = NODES.find(n => n.id === otherId)!;
                      const otherColors = NODE_COLORS[otherNode.type];
                      return (
                        <div key={idx} style={{ padding: '10px', backgroundColor: '#F9F9F7', borderRadius: '8px', border: '1px solid #F0F0EE' }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span style={{ fontSize: '9px', fontWeight: 700, color: edge.color, backgroundColor: `${edge.color}18`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${edge.color}30` }}>
                              {isSource ? '→' : '←'} {edge.label}
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
              {[
                { label: '→ Relación directa',   style: 'solid'  },
                { label: '⇢ Interacción',         style: 'dashed' },
              ].map(({ label, style }) => (
                <div key={label} className="flex items-center gap-2">
                  <div style={{ width: '24px', height: '2px', borderTop: `2px ${style} #888780` }} />
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