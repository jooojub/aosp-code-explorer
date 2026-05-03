import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { CANVAS_W, CANVAS_H, NODE_W, NODE_H, LAYERS, LEFT_PAD } from '../data/cameraData';

const R_LANE = CANVAS_W - 18;
const MINIMAP_W = 160;

// ─── Edge routing ────────────────────────────────────────────────────────────

function edgePath(src, tgt, layerMap) {
  if (src.layer === tgt.layer && src.y === tgt.y) {
    const sx = src.x + NODE_W, sy = src.y + NODE_H / 2;
    const tx = tgt.x,          ty = tgt.y + NODE_H / 2;
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  }
  if (src.layer === tgt.layer) {
    const sx = src.x + NODE_W, sy = src.y + NODE_H / 2;
    const tx = tgt.x + NODE_W, ty = tgt.y + NODE_H / 2;
    return `M${sx},${sy} C${R_LANE},${sy} ${R_LANE},${ty} ${tx},${ty}`;
  }
  const srcL = layerMap[src.layer];
  const tgtL = layerMap[tgt.layer];
  const goDown = tgtL.y > srcL.y;
  const sx = src.x + NODE_W / 2;
  const tx = tgt.x + NODE_W / 2;
  if (goDown) {
    const sy = src.y + NODE_H;
    const ty = tgt.y;
    const c1y = srcL.y + srcL.height - 6;
    const c2y = tgtL.y + 20;
    return `M${sx},${sy} C${sx},${c1y} ${tx},${c2y} ${tx},${ty}`;
  } else {
    const sy = src.y;
    const ty = tgt.y + NODE_H;
    const c1y = srcL.y + 20;
    const c2y = tgtL.y + tgtL.height - 6;
    return `M${sx},${sy} C${sx},${c1y} ${tx},${c2y} ${tx},${ty}`;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LayerBand({ layer }) {
  return (
    <g>
      <rect x={0} y={layer.y} width={CANVAS_W} height={layer.height} fill={layer.bg} />
      <rect x={0} y={layer.y} width={CANVAS_W} height={2} fill={layer.color} opacity={0.6} />
      <rect x={0} y={layer.y + layer.height - 1} width={CANVAS_W} height={1} fill={layer.color} opacity={0.25} />
      <text
        x={10} y={layer.y + 23}
        fill={layer.color} fontSize={13} fontFamily="'JetBrains Mono',monospace"
        fontWeight="700" dominantBaseline="middle"
        style={{ userSelect: 'none' }}
      >
        {layer.name}
      </text>
    </g>
  );
}

function EdgePath({ edge, nodeMap, layerMap, dimmed }) {
  const src = nodeMap[edge.source];
  const tgt = nodeMap[edge.target];
  if (!src || !tgt) return null;
  const d = edgePath(src, tgt, layerMap);
  const opacity = dimmed ? 0.07 : (edge.important ? 0.75 : 0.35);
  const strokeW = edge.important ? 1.6 : 1.0;
  return (
    <path d={d} fill="none"
      stroke="rgba(0,0,0,1)" strokeWidth={strokeW} strokeOpacity={opacity}
      markerEnd={edge.important ? 'url(#arr-main)' : 'url(#arr-sec)'}
    />
  );
}

function NodeBox({ node, isSelected, isConnected, isHovered, hasSelection, onClick, onHover }) {
  const dimmed = hasSelection && !isSelected && !isConnected;
  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={() => onClick(node)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
      opacity={dimmed ? 0.2 : 1}
    >
      {isSelected && (
        <rect x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx={6}
          fill={node.color} opacity={0.15} />
      )}
      <rect
        width={NODE_W} height={NODE_H} rx={4}
        fill={isSelected ? node.color + '20' : (isHovered ? node.color + '0d' : '#ffffff')}
        stroke={isSelected ? node.color : (isHovered ? node.color : node.color + '99')}
        strokeWidth={isSelected ? 2 : (isConnected ? 1.5 : 1)}
      />
      <text
        x={NODE_W / 2} y={NODE_H / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill={node.color} fontSize={9.5} fontFamily="'JetBrains Mono',monospace"
        fontWeight={isSelected ? '700' : '500'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {node.label}
      </text>
    </g>
  );
}

// ─── Minimap ──────────────────────────────────────────────────────────────────

function Minimap({ transform, svgW, svgH, nodes, onApplyTransform }) {
  const mmH = CANVAS_H > 0 ? Math.round(MINIMAP_W * CANVAS_H / CANVAS_W) : 200;
  const ms = MINIMAP_W / CANVAS_W;

  const svgRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  // Viewport rect in minimap coords
  const { k, x, y } = transform;
  const vpX = -x / k * ms;
  const vpY = -y / k * ms;
  const vpW = svgW > 0 ? svgW / k * ms : MINIMAP_W;
  const vpH = svgH > 0 ? svgH / k * ms : mmH;

  const handleMouseDown = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { k: ck, x: cx, y: cy } = transformRef.current;
    const vx = -cx / ck * ms;
    const vy = -cy / ck * ms;
    const vw = svgW / ck * ms;
    const vh = svgH / ck * ms;
    const inVP = mx >= vx && mx <= vx + vw && my >= vy && my <= vy + vh;
    if (inVP) {
      draggingRef.current = true;
      dragStartRef.current = { mx, my, tx: cx, ty: cy };
      e.preventDefault();
    } else {
      // Click to jump: center viewport on clicked canvas point
      const canvasX = mx / ms;
      const canvasY = my / ms;
      onApplyTransform(svgW / 2 - ck * canvasX, svgH / 2 - ck * canvasY, ck, true);
    }
  }, [ms, svgW, svgH, onApplyTransform]);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !dragStartRef.current) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dmx = mx - dragStartRef.current.mx;
      const dmy = my - dragStartRef.current.my;
      const { k: ck } = transformRef.current;
      const newTx = dragStartRef.current.tx - (dmx / ms) * ck;
      const newTy = dragStartRef.current.ty - (dmy / ms) * ck;
      onApplyTransform(newTx, newTy, ck, false);
    };
    const onUp = () => { draggingRef.current = false; dragStartRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [ms, onApplyTransform]);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #d0d7de',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        padding: '3px 8px',
        borderBottom: '1px solid #d0d7de',
        fontSize: 9, fontFamily: 'monospace',
        color: '#57606a', fontWeight: 700, letterSpacing: '0.08em',
      }}>
        MINIMAP
      </div>
      <svg
        ref={svgRef}
        width={MINIMAP_W} height={mmH}
        onMouseDown={handleMouseDown}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <rect width={MINIMAP_W} height={mmH} fill="#f6f8fa" />
        {LAYERS.map(l => (
          <g key={l.id}>
            <rect x={0} y={l.y * ms} width={MINIMAP_W} height={l.height * ms} fill={l.bg} />
            <rect x={0} y={l.y * ms} width={MINIMAP_W} height={Math.max(0.5, 2 * ms)} fill={l.color} opacity={0.6} />
          </g>
        ))}
        {nodes.map(n => (
          <rect key={n.id}
            x={n.x * ms} y={n.y * ms}
            width={Math.max(2, NODE_W * ms)} height={Math.max(1, NODE_H * ms)}
            fill={n.color} opacity={0.55} rx={0.5}
          />
        ))}
        {/* Viewport rect */}
        <rect
          x={vpX} y={vpY}
          width={Math.max(4, vpW)} height={Math.max(4, vpH)}
          fill="rgba(37,99,235,0.08)"
          stroke="#2563eb" strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ cursor: 'move' }}
        />
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArchMap({ nodes, edges, selectedNode, onNodeClick }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [zoomTransform, setZoomTransform] = useState({ k: 1, x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl) return;

    const zoom = d3.zoom()
      .scaleExtent([0.07, 5])
      .wheelDelta(event => -event.deltaY * (event.deltaMode === 1 ? 0.03 : event.deltaMode ? 1 : 0.001))
      .on('zoom', (event) => {
        d3.select(gEl).attr('transform', event.transform);
        setZoomPct(Math.round(event.transform.k * 100));
        setZoomTransform({ k: event.transform.k, x: event.transform.x, y: event.transform.y });
      });

    zoomRef.current = zoom;
    d3.select(svgEl).call(zoom);

    const fit = () => {
      const { clientWidth: W, clientHeight: H } = svgEl;
      setSvgSize({ w: W, h: H });
      const scale = Math.min(W / CANVAS_W, H / CANVAS_H) * 0.9;
      const tx = (W - CANVAS_W * scale) / 2;
      const ty = (H - CANVAS_H * scale) / 2 + 10;
      d3.select(svgEl).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    };

    fit();
    window.addEventListener('resize', fit);
    return () => {
      d3.select(svgEl).on('.zoom', null);
      window.removeEventListener('resize', fit);
    };
  }, []);

  const changeZoom = useCallback((factor) => {
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    if (!svgEl || !zoom) return;
    d3.select(svgEl).transition().duration(200).call(zoom.scaleBy, factor);
  }, []);

  const resetZoom = useCallback(() => {
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    if (!svgEl || !zoom) return;
    const { clientWidth: W, clientHeight: H } = svgEl;
    const scale = Math.min(W / CANVAS_W, H / CANVAS_H) * 0.9;
    const tx = (W - CANVAS_W * scale) / 2;
    const ty = (H - CANVAS_H * scale) / 2 + 10;
    d3.select(svgEl).transition().duration(250)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }, []);

  const handleApplyTransform = useCallback((tx, ty, k, animated) => {
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    if (!svgEl || !zoom) return;
    const t = d3.zoomIdentity.translate(tx, ty).scale(k);
    if (animated) {
      d3.select(svgEl).transition().duration(200).call(zoom.transform, t);
    } else {
      d3.select(svgEl).call(zoom.transform, t);
    }
  }, []);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);
  const layerMap = useMemo(() => Object.fromEntries(LAYERS.map(l => [l.id, l])), []);

  const connectedIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const visited = new Set();
    const queue = [selectedNode.id];
    while (queue.length) {
      const id = queue.shift();
      edges.forEach(e => {
        if (e.source === id && !visited.has(e.target)) {
          visited.add(e.target);
          queue.push(e.target);
        }
      });
    }
    return visited;
  }, [selectedNode, edges]);

  const hasSelection = !!selectedNode;
  const activeIds = useMemo(
    () => selectedNode ? new Set([selectedNode.id, ...connectedIds]) : null,
    [selectedNode, connectedIds]
  );
  const handleHover = useCallback((id) => setHovered(id), []);

  return (
    <div className="w-full h-full relative" style={{ background: '#f6f8fa' }}>
      <svg ref={svgRef} className="w-full h-full" style={{ display: 'block' }}>
        <defs>
          <marker id="arr-main" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="rgba(0,0,0,0.5)" />
          </marker>
          <marker id="arr-sec" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
            <polygon points="0 0, 5 2, 0 4" fill="rgba(0,0,0,0.25)" />
          </marker>
        </defs>
        <g ref={gRef}>
          <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#f6f8fa" />
          {LAYERS.map(layer => <LayerBand key={layer.id} layer={layer} />)}
          {edges.map(edge => {
            const isConnectedEdge = hasSelection &&
              activeIds.has(edge.source) && activeIds.has(edge.target);
            const dimmed = hasSelection && !isConnectedEdge;
            return (
              <EdgePath key={`${edge.source}→${edge.target}`}
                edge={edge} nodeMap={nodeMap} layerMap={layerMap} dimmed={dimmed} />
            );
          })}
          {nodes.map(node => (
            <NodeBox key={node.id} node={node}
              isSelected={selectedNode?.id === node.id}
              isConnected={connectedIds.has(node.id)}
              isHovered={hovered === node.id}
              hasSelection={hasSelection}
              onClick={onNodeClick} onHover={handleHover}
            />
          ))}
        </g>
      </svg>

      {/* Top-right controls: zoom + minimap */}
      <div className="absolute top-3 right-3 flex flex-col gap-2" style={{ zIndex: 10 }}>
        {/* Zoom controls */}
        <div
          className="flex items-center gap-1"
          style={{
            background: '#ffffff', border: '1px solid #d0d7de',
            borderRadius: 6, padding: '3px 4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <button
            onClick={() => changeZoom(1 / 1.3)}
            className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
            style={{ width: 22, height: 22, fontSize: 16, color: '#57606a', lineHeight: 1 }}
          >−</button>
          <button
            onClick={resetZoom}
            className="hover:bg-black/5 rounded transition-colors"
            style={{ minWidth: 48, height: 22, fontSize: 11, fontFamily: 'monospace', color: '#24292f', textAlign: 'center' }}
          >{zoomPct}%</button>
          <button
            onClick={() => changeZoom(1.3)}
            className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
            style={{ width: 22, height: 22, fontSize: 16, color: '#57606a', lineHeight: 1 }}
          >+</button>
        </div>

        {/* Minimap */}
        <Minimap
          transform={zoomTransform}
          svgW={svgSize.w} svgH={svgSize.h}
          nodes={nodes}
          onApplyTransform={handleApplyTransform}
        />
      </div>
    </div>
  );
}
