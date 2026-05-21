import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from '../components/TopBar';
import { EntityTag, EntityType } from '../components/EntityTag';
import { ZoomIn, ZoomOut, Maximize2, Filter, Circle, GitBranch, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import { graphApi, type DocumentSource } from '../lib/api';

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
  relationType: string;
}

const RELATION_COLORS: Record<string, string> = {
  PLANT_HAS_COMPOUND:                '#1D9E75',
  COMPOUND_INTERACTS_WITH_PROTEIN:   '#7F77DD',
  COMPOUND_ASSOCIATED_WITH_DISEASE:  '#D85A30',
  PROTEIN_ASSOCIATED_WITH_DISEASE:   '#B03A8C',
};

const RELATION_LABELS: Record<string, string> = {
  PLANT_HAS_COMPOUND:                'Planta → Compuesto',
  COMPOUND_INTERACTS_WITH_PROTEIN:   'Compuesto → Proteína',
  COMPOUND_ASSOCIATED_WITH_DISEASE:  'Compuesto → Enfermedad',
  PROTEIN_ASSOCIATED_WITH_DISEASE:   'Proteína → Enfermedad',
};

const NODE_COLORS: Record<EntityType, { fill: string; stroke: string; text: string }> = {
  plant:    { fill: '#E1F5EE', stroke: '#1D9E75', text: '#085041' },
  protein:  { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489' },
  compound: { fill: '#FAEEDA', stroke: '#BA7517', text: '#633806' },
  disease:  { fill: '#FAECE7', stroke: '#D85A30', text: '#993C1D' },
  all:      { fill: '#F0F0EE', stroke: '#888780', text: '#444441' },
};

const NODE_RADIUS = 34;
const MIN_ARC_SEP = 88; // minimum px arc distance between node centers

// ── Layout: concentric rings with dynamic radii ────────────────────────────
function computeConcentricLayout(entities: { name: string; type: EntityType }[]): GraphNode[] {
  const byType: Record<string, { name: string; type: EntityType }[]> = {
    plant: [], compound: [], protein: [], disease: [],
  };
  entities.forEach(e => { byType[e.type]?.push(e); });

  const minR = (count: number, base: number) =>
    count <= 1 ? base : Math.max(base, (MIN_ARC_SEP * count) / (2 * Math.PI));

  const r_plant    = minR(byType.plant.length,    60);
  const r_compound = Math.max(r_plant + 150, minR(byType.compound.length, 200));
  const r_protein  = Math.max(r_compound + 140, minR(byType.protein.length, 350));
  const r_disease  = Math.max(r_protein + 140, minR(byType.disease.length, 500));

  const rings = [
    { key: 'plant',    type: 'plant'    as EntityType, r: r_plant    },
    { key: 'compound', type: 'compound' as EntityType, r: r_compound },
    { key: 'protein',  type: 'protein'  as EntityType, r: r_protein  },
    { key: 'disease',  type: 'disease'  as EntityType, r: r_disease  },
  ];

  const result: GraphNode[] = [];
  rings.forEach(({ key, type, r }) => {
    const group = byType[key] ?? [];
    group.forEach((e, i) => {
      const angle = (2 * Math.PI * i) / (group.length || 1) - Math.PI / 2;
      result.push({ id: e.name, label: e.name, type, x: r * Math.cos(angle), y: r * Math.sin(angle) });
    });
  });
  return result;
}

// ── Layout: layered left-to-right  Plantas → Compuestos → Proteínas → Enfermedades ──
function computeLayeredLayout(
  entities: { name: string; type: EntityType }[],
  edges: GraphEdge[],
): GraphNode[] {
  const LAYER_INDEX: Record<string, number> = { plant: 0, compound: 1, protein: 2, disease: 3 };
  const LAYER_X_GAP = 300;  // px between layer columns
  const NODE_VSEP   = 96;   // minimum vertical separation within a layer

  const byLayer: { name: string; type: EntityType }[][] = [[], [], [], []];
  entities.forEach(e => {
    const li = LAYER_INDEX[e.type];
    if (li !== undefined) byLayer[li].push(e);
  });

  // Initial positions centred around y = 0
  const nodes: GraphNode[] = byLayer.flatMap((layer, li) => {
    const totalH = (layer.length - 1) * NODE_VSEP;
    return layer.map((e, i) => ({
      id: e.name, label: e.name, type: e.type,
      x: li * LAYER_X_GAP,
      y: i * NODE_VSEP - totalH / 2,
    }));
  });

  const nodeMap = new Map<string, GraphNode>(nodes.map(n => [n.id, n]));

  // Barycenter heuristic: sort each layer by the average Y of its neighbours
  // in the adjacent layer, then re-space to avoid overlaps.
  function barycenter(layerIdx: number, adjLayerIdx: number) {
    const layerNodes = nodes.filter(n => LAYER_INDEX[n.type] === layerIdx);
    if (!layerNodes.length) return;

    layerNodes.forEach(node => {
      const neighbours = edges
        .flatMap(e => {
          if (e.source === node.id) return [e.target];
          if (e.target === node.id) return [e.source];
          return [];
        })
        .map(id => nodeMap.get(id))
        .filter((n): n is GraphNode => !!n && LAYER_INDEX[n.type] === adjLayerIdx);

      if (neighbours.length > 0) {
        node.y = neighbours.reduce((s, n) => s + n.y, 0) / neighbours.length;
      }
    });

    // Re-space to prevent overlaps, then re-centre vertically
    layerNodes.sort((a, b) => a.y - b.y);
    for (let i = 1; i < layerNodes.length; i++) {
      if (layerNodes[i].y - layerNodes[i - 1].y < NODE_VSEP) {
        layerNodes[i].y = layerNodes[i - 1].y + NODE_VSEP;
      }
    }
    const midY = (layerNodes[0].y + layerNodes[layerNodes.length - 1].y) / 2;
    layerNodes.forEach(n => { n.y -= midY; });
  }

  // 3 forward + backward sweeps
  for (let sweep = 0; sweep < 3; sweep++) {
    for (let li = 1; li <= 3; li++) barycenter(li, li - 1);
    for (let li = 2; li >= 0; li--) barycenter(li, li + 1);
  }

  return nodes;
}

// ── Layout: force-directed simulation ─────────────────────────────────────
function runForceSimulation(initNodes: GraphNode[], edges: GraphEdge[], iterations = 280): GraphNode[] {
  if (initNodes.length === 0) return initNodes;

  const pos = initNodes.map(n => ({ x: n.x, y: n.y, vx: 0, vy: 0 }));
  const idx = new Map<string, number>(initNodes.map((n, i) => [n.id, i]));

  const REPULSION     = 9000;
  const SPRING_LEN    = 130;
  const SPRING_K      = 0.04;
  const GRAVITY       = 0.018;
  const DAMPING       = 0.82;

  // Only use compound↔protein springs to avoid plant→all_compounds collapsing the graph
  const springEdges = edges
    .filter(e => e.relationType === 'COMPOUND_INTERACTS_WITH_PROTEIN')
    .map(e => [idx.get(e.source), idx.get(e.target)] as [number, number])
    .filter(([a, b]) => a !== undefined && b !== undefined);

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - (iter / iterations) * 0.6;
    const fx = new Float64Array(pos.length);
    const fy = new Float64Array(pos.length);

    // Repulsion
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist  = Math.sqrt(dist2);
        const f = REPULSION / dist2;
        const ux = dx / dist, uy = dy / dist;
        fx[i] -= ux * f; fy[i] -= uy * f;
        fx[j] += ux * f; fy[j] += uy * f;
      }
    }

    // Springs (only for meaningful edges)
    for (const [si, ti] of springEdges) {
      const dx = pos[ti].x - pos[si].x;
      const dy = pos[ti].y - pos[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = SPRING_K * (dist - SPRING_LEN);
      const ux = dx / dist, uy = dy / dist;
      fx[si] += ux * f; fy[si] += uy * f;
      fx[ti] -= ux * f; fy[ti] -= uy * f;
    }

    // Gravity toward center
    for (let i = 0; i < pos.length; i++) {
      fx[i] -= pos[i].x * GRAVITY;
      fy[i] -= pos[i].y * GRAVITY;
    }

    // Integrate
    for (let i = 0; i < pos.length; i++) {
      pos[i].vx = (pos[i].vx + fx[i]) * DAMPING * cooling;
      pos[i].vy = (pos[i].vy + fy[i]) * DAMPING * cooling;
      pos[i].x += pos[i].vx;
      pos[i].y += pos[i].vy;
    }
  }

  return initNodes.map((n, i) => ({ ...n, x: pos[i].x, y: pos[i].y }));
}

export function KnowledgeGraph() {
  const svgRef    = useRef<SVGSVGElement>(null);
  const [zoom, setZoom]                 = useState(1);
  const [pan, setPan]                   = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning]       = useState(false);
  const [panStart, setPanStart]         = useState({ x: 0, y: 0 });
  const [selected, setSelected]         = useState<string | null>(null);
  const [hovered, setHovered]           = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge]   = useState<number | null>(null);
  const [activeTypes, setActiveTypes]   = useState<Set<EntityType>>(
    new Set(['plant', 'protein', 'compound', 'disease'])
  );
  const [activeRelations, setActiveRelations] = useState<Set<string>>(
    new Set(Object.keys(RELATION_COLORS))
  );
  const [layout, setLayout]     = useState<'circular' | 'force' | 'layered'>('circular');
  const [panelOpen, setPanelOpen] = useState(true);
  const [nodes, setNodes]     = useState<GraphNode[]>([]);
  const [edges, setEdges]     = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodeSources, setNodeSources]       = useState<DocumentSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // ── Auto-fit view to all nodes ──────────────────────────────────────────
  const fitView = useCallback((nodeList: GraphNode[]) => {
    if (nodeList.length === 0 || !svgRef.current) return;
    const svg = svgRef.current;
    const W = svg.clientWidth  || 800;
    const H = svg.clientHeight || 600;
    const pad = NODE_RADIUS + 30;
    const minX = Math.min(...nodeList.map(n => n.x)) - pad;
    const maxX = Math.max(...nodeList.map(n => n.x)) + pad;
    const minY = Math.min(...nodeList.map(n => n.y)) - pad;
    const maxY = Math.max(...nodeList.map(n => n.y)) + pad;
    const newZoom = Math.min(W / (maxX - minX), H / (maxY - minY), 1.8);
    setPan({
      x: W / 2 - ((minX + maxX) / 2) * newZoom,
      y: H / 2 - ((minY + maxY) / 2) * newZoom,
    });
    setZoom(newZoom);
  }, []);

  // ── Load data from API ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [plantRes, compoundRes, proteinRes, diseaseRes] = await Promise.all([
          graphApi.entities('plant',    undefined, 100),
          graphApi.entities('compound', undefined, 200),
          graphApi.entities('protein',  undefined, 100),
          graphApi.entities('disease',  undefined, 100),
        ]);
        if (cancelled) return;

        const allEntities = [
          ...plantRes.items.map(e =>    ({ name: e.name, type: 'plant'    as EntityType })),
          ...compoundRes.items.map(e => ({ name: e.name, type: 'compound' as EntityType })),
          ...proteinRes.items.map(e =>  ({ name: e.name, type: 'protein'  as EntityType })),
          ...diseaseRes.items.map(e =>  ({ name: e.name, type: 'disease'  as EntityType })),
        ];

        const neighborResults = await Promise.allSettled([
          ...plantRes.items.map(p =>   graphApi.neighbors('plant',    p.name, 2)),
          ...compoundRes.items.map(c => graphApi.neighbors('compound', c.name, 1)),
          ...proteinRes.items.map(p =>  graphApi.neighbors('protein',  p.name, 1)),
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
              source: e.from_name, target: e.to_name,
              label: e.relation_type,
              color: RELATION_COLORS[e.relation_type] ?? '#888780',
              relationType: e.relation_type,
            });
          }
        }

        const positioned = computeConcentricLayout(allEntities);
        if (!cancelled) {
          setNodes(positioned);
          setEdges(newEdges);
          setTimeout(() => fitView(positioned), 50);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Switch layout ───────────────────────────────────────────────────────
  useEffect(() => {
    if (nodes.length === 0) return;
    const allEntities = nodes.map(n => ({ name: n.id, type: n.type }));
    let newNodes: GraphNode[];
    if (layout === 'circular') {
      newNodes = computeConcentricLayout(allEntities);
    } else if (layout === 'layered') {
      newNodes = computeLayeredLayout(allEntities, edges);
    } else {
      const init = computeConcentricLayout(allEntities);
      newNodes = runForceSimulation(init, edges);
    }
    setNodes(newNodes);
    setTimeout(() => fitView(newNodes), 50);
    setSelected(null);
  }, [layout]);

  // ── Fetch source articles when a node is selected ──────────────────────
  useEffect(() => {
    const node = nodes.find(n => n.id === selected);
    if (!node) { setNodeSources([]); return; }
    let cancelled = false;
    setLoadingSources(true);
    graphApi.nodeSources(node.type, node.label)
      .then(res => { if (!cancelled) setNodeSources(res.sources); })
      .catch(() => { if (!cancelled) setNodeSources([]); })
      .finally(() => { if (!cancelled) setLoadingSources(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, nodes]);

  // ── Derived state ───────────────────────────────────────────────────────
  const selectedNode = nodes.find(n => n.id === selected);
  const visibleNodes = nodes.filter(n => activeTypes.has(n.type));
  const visibleIds   = new Set(visibleNodes.map(n => n.id));

  const visibleEdges = edges.filter(e =>
    visibleIds.has(e.source) &&
    visibleIds.has(e.target) &&
    activeRelations.has(e.relationType)
  );

  const connectedIds: Set<string> | null = selected
    ? new Set(visibleEdges.filter(e => e.source === selected || e.target === selected).flatMap(e => [e.source, e.target]))
    : null;

  // ── Zoom / Pan ──────────────────────────────────────────────────────────
  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.2));
  const handleReset   = () => { fitView(nodes); setSelected(null); };

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

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.2), 3));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const toggleType = (type: EntityType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) { if (next.size > 1) next.delete(type); }
      else next.add(type);
      return next;
    });
  };

  const toggleRelation = (rel: string) => {
    setActiveRelations(prev => {
      const next = new Set(prev);
      if (next.has(rel)) { if (next.size > 1) next.delete(rel); }
      else next.add(rel);
      return next;
    });
  };

  // ── Edge geometry ───────────────────────────────────────────────────────
  const edgePoints = (src: GraphNode, tgt: GraphNode) => {
    const dx = tgt.x - src.x, dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    return {
      x1: src.x + ux * NODE_RADIUS,       y1: src.y + uy * NODE_RADIUS,
      x2: tgt.x - ux * (NODE_RADIUS + 8), y2: tgt.y - uy * (NODE_RADIUS + 8),
      mx: (src.x + tgt.x) / 2,            my: (src.y + tgt.y) / 2,
    };
  };

  // For layered mode: connect right-side of source to left-side of target
  const edgePointsLayered = (src: GraphNode, tgt: GraphNode) => {
    const x1 = src.x + NODE_RADIUS;
    const x2 = tgt.x - NODE_RADIUS - 8;
    return { x1, y1: src.y, x2, y2: tgt.y, mx: (x1 + x2) / 2, my: (src.y + tgt.y) / 2 };
  };

  // Cubic bezier S-curve used in layered mode
  const bezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
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
              {Object.entries(RELATION_COLORS).map(([rel, color]) => (
                <marker key={rel} id={`arrow-${rel}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={color} />
                </marker>
              ))}
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E8E8E6" strokeWidth="0.5" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

              {/* ── Encabezados de capa (solo en modo layered) ── */}
              {layout === 'layered' && (() => {
                const LAYER_X_GAP = 300;
                const LAYERS = [
                  { label: 'Plantas',      type: 'plant'    as EntityType, li: 0 },
                  { label: 'Compuestos',   type: 'compound' as EntityType, li: 1 },
                  { label: 'Proteínas',    type: 'protein'  as EntityType, li: 2 },
                  { label: 'Enfermedades', type: 'disease'  as EntityType, li: 3 },
                ];
                const minY = visibleNodes.length > 0
                  ? Math.min(...visibleNodes.map(n => n.y)) - 70
                  : -200;
                return LAYERS.map(({ label, type, li }) => {
                  const colors = NODE_COLORS[type];
                  const cx = li * LAYER_X_GAP;
                  return (
                    <g key={label}>
                      {/* coloured pill background */}
                      <rect
                        x={cx - 52} y={minY - 14} width={104} height={24} rx={12}
                        fill={colors.fill} stroke={colors.stroke} strokeWidth={1}
                      />
                      <text
                        x={cx} y={minY + 3} textAnchor="middle"
                        style={{ fontSize: '11px', fontWeight: 700, fill: colors.text, fontFamily: 'system-ui', pointerEvents: 'none' }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* ── Aristas ── */}
              {visibleEdges.map((edge, idx) => {
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;

                const isConnected = !selected || edge.source === selected || edge.target === selected;
                if (selected && !isConnected) return null;

                const isHoveredEdge = hoveredEdge === idx;
                const opacity = selected ? 1 : (isHoveredEdge ? 1 : layout === 'layered' ? 0.18 : 0.08);
                const strokeW = isHoveredEdge ? 2 : 1.2;
                const pts = layout === 'layered' ? edgePointsLayered(src, tgt) : edgePoints(src, tgt);
                const { x1, y1, x2, y2, mx, my } = pts;
                const pathD = layout === 'layered' ? bezierPath(x1, y1, x2, y2) : undefined;

                return (
                  <g key={idx} style={{ opacity, transition: 'opacity 0.15s' }}>
                    {pathD ? (
                      <path
                        d={pathD} fill="none"
                        stroke={edge.color}
                        strokeWidth={strokeW}
                        markerEnd={`url(#arrow-${edge.relationType})`}
                      />
                    ) : (
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={edge.color}
                        strokeWidth={strokeW}
                        markerEnd={`url(#arrow-${edge.relationType})`}
                      />
                    )}
                    {/* invisible wider hit area */}
                    {pathD ? (
                      <path d={pathD} fill="none" stroke="transparent" strokeWidth={12}
                        style={{ cursor: 'crosshair' }}
                        onMouseEnter={() => setHoveredEdge(idx)}
                        onMouseLeave={() => setHoveredEdge(null)}
                      />
                    ) : (
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="transparent" strokeWidth={12}
                        style={{ cursor: 'crosshair' }}
                        onMouseEnter={() => setHoveredEdge(idx)}
                        onMouseLeave={() => setHoveredEdge(null)}
                      />
                    )}
                    {/* label only on hover */}
                    {isHoveredEdge && (
                      <g>
                        <rect x={mx - 28} y={my - 9} width="56" height="16" rx="4"
                          fill="white" stroke={edge.color} strokeWidth="1" opacity="0.97" />
                        <text x={mx} y={my + 3} textAnchor="middle"
                          style={{ fontSize: '7px', fontWeight: 700, fill: edge.color, fontFamily: 'monospace', pointerEvents: 'none' }}>
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
                const opacity = selected && !isConn ? 0.12 : 1;
                const r       = isSel ? NODE_RADIUS + 5 : isHov ? NODE_RADIUS + 2 : NODE_RADIUS;

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
                      <circle cx={node.x} cy={node.y} r={r + 9} fill={colors.stroke} opacity="0.1" />
                    )}
                    <circle
                      cx={node.x} cy={node.y} r={r}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSel ? 3 : 1.5}
                      style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
                    />
                    <text
                      x={node.x} y={node.y - 3}
                      textAnchor="middle"
                      style={{ fontSize: node.label.length > 10 ? '8.5px' : '10px', fontWeight: 700, fill: colors.text, fontFamily: 'system-ui', pointerEvents: 'none' }}
                    >
                      {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                    </text>
                    <text
                      x={node.x} y={node.y + 10}
                      textAnchor="middle"
                      style={{ fontSize: '7.5px', fill: colors.stroke, fontFamily: 'system-ui', opacity: 0.75, pointerEvents: 'none' }}
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
              { icon: <ZoomIn size={15} />, action: handleZoomIn,  title: 'Acercar'       },
              { icon: <ZoomOut size={15} />, action: handleZoomOut, title: 'Alejar'        },
              { icon: <Maximize2 size={15} />, action: handleReset, title: 'Ajustar vista' },
            ].map(({ icon, action, title }) => (
              <button key={title} onClick={action} title={title}
                style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#444441', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                {icon}
              </button>
            ))}
          </div>

          {/* Layout toggle */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '4px', backgroundColor: '#FFFFFF', border: '1px solid #E5E5E3', borderRadius: '10px', padding: '4px' }}>
            {([
            ['circular', <Circle size={13} />,   'Circular'],
            ['layered',  <Layers size={13} />,   'Capas'   ],
            ['force',    <GitBranch size={13} />, 'Fuerza'  ],
          ] as const).map(([mode, icon, label]) => (
              <button key={mode} onClick={() => setLayout(mode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                  borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                  backgroundColor: layout === mode ? '#185FA5' : 'transparent',
                  color: layout === mode ? '#FFFFFF' : '#888780',
                  transition: 'all 0.15s',
                }}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Zoom % */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #E5E5E3', borderRadius: '6px', fontSize: '11px', color: '#888780' }}>
            {Math.round(zoom * 100)}%
          </div>

          {/* Hint cuando nada seleccionado */}
          {!selected && !loading && nodes.length > 0 && (
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(26,26,26,0.75)', color: '#FFFFFF', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              Haz clic en un nodo para ver sus aristas
            </div>
          )}
        </div>

        {/* ── Panel lateral ── */}
        {/* Wrapper sin overflow para que el botón siempre sea visible */}
        <div style={{ position: 'relative', flexShrink: 0, width: panelOpen ? '280px' : '0px', transition: 'width 0.25s ease' }}>
          {/* Toggle button — fuera del overflow:hidden */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            title={panelOpen ? 'Ocultar panel' : 'Mostrar panel'}
            style={{
              position: 'absolute', left: '-22px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: '22px', height: '48px', borderRadius: '6px 0 0 6px',
              backgroundColor: '#FFFFFF', border: '1px solid #E5E5E3', borderRight: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#888780', boxShadow: '-3px 0 8px rgba(0,0,0,0.08)',
            }}>
            {panelOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
          {/* Contenido con overflow:hidden para la animación */}
          <div style={{ width: '280px', height: '100%', overflowY: 'auto', backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E5E3', display: 'flex', flexDirection: 'column' }}>

          {/* Filtros nodo */}
          <div style={{ padding: '16px', borderBottom: '1px solid #F0F0EE' }}>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={13} color="#888780" />
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A' }}>Tipos de nodo</h3>
            </div>
            <div className="flex flex-col gap-2">
              {(['plant', 'protein', 'compound', 'disease'] as EntityType[]).map(type => {
                const colors = NODE_COLORS[type];
                const active = activeTypes.has(type);
                const count  = nodes.filter(n => n.type === type).length;
                return (
                  <button key={type} onClick={() => toggleType(type)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: active ? colors.fill : '#F5F5F3', transition: 'all 0.15s', textAlign: 'left' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: active ? colors.stroke : '#CCCCCC', flexShrink: 0, transition: 'background-color 0.15s' }} />
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
                { label: 'Nodos',      value: visibleNodes.length,  color: '#185FA5' },
                { label: 'Relaciones', value: visibleEdges.length,   color: '#1D9E75' },
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
          <div style={{ padding: '16px' }}>
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
                    Relaciones ({visibleEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {visibleEdges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, idx) => {
                      const isSource  = edge.source === selectedNode.id;
                      const otherId   = isSource ? edge.target : edge.source;
                      const otherNode = nodes.find(n => n.id === otherId);
                      if (!otherNode) return null;
                      return (
                        <div key={idx} style={{ padding: '10px', backgroundColor: '#F9F9F7', borderRadius: '8px', border: '1px solid #F0F0EE' }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span style={{ fontSize: '9px', fontWeight: 700, color: edge.color, backgroundColor: `${edge.color}18`, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${edge.color}30` }}>
                              {isSource ? '→' : '←'} {edge.label.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelected(otherId)}
                            style={{ fontSize: '12px', fontWeight: 600, color: NODE_COLORS[otherNode.type].text, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontStyle: otherNode.type === 'plant' ? 'italic' : 'normal' }}>
                            {otherNode.label}
                          </button>
                          <p style={{ fontSize: '10px', color: '#AAAAAA', marginTop: '2px', textTransform: 'capitalize' }}>{otherNode.type}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              {/* ── Artículos fuente ── */}
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888780', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '10px' }}>
                  Artículos fuente {!loadingSources && `(${nodeSources.length})`}
                </p>
                {loadingSources ? (
                  <p style={{ fontSize: '11px', color: '#AAAAAA' }}>Cargando...</p>
                ) : nodeSources.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#AAAAAA' }}>Sin fuentes registradas</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {nodeSources.map((src, idx) => (
                      <div key={idx} style={{ borderRadius: '8px', border: '1px solid #D6E4FF', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 12px', backgroundColor: '#EEF4FF', borderBottom: '1px solid #D6E4FF' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A3A6E', lineHeight: '1.45', fontStyle: 'italic' }}>
                            {src.title ?? src.original_filename}
                          </p>
                        </div>
                        <div style={{ padding: '8px 12px', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {src.authors && (
                            <p style={{ fontSize: '10px', color: '#666' }}>{src.authors}</p>
                          )}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {src.publication_year && (
                              <span style={{ fontSize: '9px', color: '#888780', backgroundColor: '#F0F0EE', padding: '1px 6px', borderRadius: '3px' }}>
                                {src.publication_year}
                              </span>
                            )}
                            {src.doi && (
                              <span style={{ fontSize: '9px', color: '#185FA5', backgroundColor: '#EAF1FB', padding: '1px 6px', borderRadius: '3px' }}>
                                DOI: {src.doi}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
            )}
          </div>

          {/* Leyenda con toggles de relación */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F0EE', backgroundColor: '#FAFAFA' }}>
            <p style={{ fontSize: '10px', color: '#888780', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Tipos de relación
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(RELATION_LABELS).map(([rel, label]) => {
                const color  = RELATION_COLORS[rel];
                const active = activeRelations.has(rel);
                return (
                  <button key={rel} onClick={() => toggleRelation(rel)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', opacity: active ? 1 : 0.35, transition: 'opacity 0.15s' }}>
                    <div style={{ width: '24px', height: '2.5px', backgroundColor: color, borderRadius: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', color: active ? '#444441' : '#888780', textAlign: 'left' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          </div>{/* fin contenido overflow:hidden */}
        </div>{/* fin wrapper panel */}
      </div>
    </>
  );
}
