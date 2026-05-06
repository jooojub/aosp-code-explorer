import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';

const MINIMAP_W = 160;

// ─── Edge routing ────────────────────────────────────────────────────────────

function edgePath(src, tgt, layerMap, nodeW, nodeH, rLane) {
  if (src.layer === tgt.layer && src.y === tgt.y) {
    const sx = src.x + nodeW, sy = src.y + nodeH / 2;
    const tx = tgt.x,          ty = tgt.y + nodeH / 2;
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  }
  if (src.layer === tgt.layer) {
    const sx = src.x + nodeW, sy = src.y + nodeH / 2;
    const tx = tgt.x + nodeW, ty = tgt.y + nodeH / 2;
    return `M${sx},${sy} C${rLane},${sy} ${rLane},${ty} ${tx},${ty}`;
  }
  const srcL = layerMap[src.layer];
  const tgtL = layerMap[tgt.layer];
  const goDown = tgtL.y > srcL.y;
  const sx = src.x + nodeW / 2;
  const tx = tgt.x + nodeW / 2;
  if (goDown) {
    const sy = src.y + nodeH;
    const ty = tgt.y;
    const c1y = srcL.y + srcL.height - 6;
    const c2y = tgtL.y + 20;
    return `M${sx},${sy} C${sx},${c1y} ${tx},${c2y} ${tx},${ty}`;
  } else {
    const sy = src.y;
    const ty = tgt.y + nodeH;
    const c1y = srcL.y + 20;
    const c2y = tgtL.y + tgtL.height - 6;
    return `M${sx},${sy} C${sx},${c1y} ${tx},${c2y} ${tx},${ty}`;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LayerBand({ layer, canvasW }) {
  return (
    <g>
      <rect x={0} y={layer.y} width={canvasW} height={layer.height} fill={layer.bg} />
      <rect x={0} y={layer.y} width={canvasW} height={2} fill={layer.color} opacity={0.6} />
      <rect x={0} y={layer.y + layer.height - 1} width={canvasW} height={1} fill={layer.color} opacity={0.25} />
      <text
        x={10} y={layer.y + 23}
        fill={layer.color} fontSize={13} fontFamily="'Nunito',sans-serif"
        fontWeight="700" dominantBaseline="middle"
        style={{ userSelect: 'none' }}
      >
        {layer.name}
      </text>
    </g>
  );
}

function EdgePath({ edge, nodeMap, layerMap, dimmed, nodeW, nodeH, rLane }) {
  const src = nodeMap[edge.source];
  const tgt = nodeMap[edge.target];
  if (!src || !tgt) return null;
  const d = edgePath(src, tgt, layerMap, nodeW, nodeH, rLane);
  const opacity = dimmed ? 0.07 : (edge.important ? 0.75 : 0.35);
  const strokeW = edge.important ? 1.6 : 1.0;
  return (
    <path d={d} fill="none"
      stroke="rgba(44,57,71,1)" strokeWidth={strokeW} strokeOpacity={opacity}
      markerEnd={edge.important ? 'url(#arr-main)' : 'url(#arr-sec)'}
    />
  );
}

function NodeBox({ node, isSelected, isConnected, isHovered, hasSelection, onClick, onHover, nodeW, nodeH }) {
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
        <rect x={-3} y={-3} width={nodeW + 6} height={nodeH + 6} rx={6}
          fill={node.color} opacity={0.15} />
      )}
      <rect
        width={nodeW} height={nodeH} rx={4}
        fill={isSelected ? node.color + '20' : (isHovered ? node.color + '0d' : '#ffffff')}
        stroke={isSelected ? node.color : (isHovered ? node.color : node.color + '99')}
        strokeWidth={isSelected ? 2 : (isConnected ? 1.5 : 1)}
      />
      <text
        x={nodeW / 2} y={nodeH / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill={node.color} fontSize={9.5} fontFamily="'Nunito',sans-serif"
        fontWeight={isSelected ? '700' : '500'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {node.label}
      </text>
    </g>
  );
}

// ─── Minimap ──────────────────────────────────────────────────────────────────

function Minimap({ transform, svgW, svgH, nodes, onApplyTransform, onFit, layers, canvasW, canvasH, nodeW, nodeH }) {
  const mmH = canvasH > 0 ? Math.round(MINIMAP_W * canvasH / canvasW) : 200;
  const ms = MINIMAP_W / canvasW;

  const svgRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);

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
      border: '1px solid #C5CFD8',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        padding: '3px 8px',
        borderBottom: '1px solid #C5CFD8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 9, fontFamily: "'Nunito', sans-serif", color: '#547A95', fontWeight: 700, letterSpacing: '0.08em' }}>
          MINIMAP
        </span>
        <button
          onClick={onFit}
          className="hover:bg-black/5 rounded transition-colors"
          style={{
            fontSize: 9, fontFamily: "'Nunito', sans-serif", color: '#547A95',
            padding: '1px 5px', border: '1px solid #547A9533',
            borderRadius: 4, lineHeight: 1.6, cursor: 'pointer',
            background: '#547A950d',
          }}
        >
          Fit
        </button>
      </div>
      <svg
        ref={svgRef}
        width={MINIMAP_W} height={mmH}
        onMouseDown={handleMouseDown}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <rect width={MINIMAP_W} height={mmH} fill="#E8EDF2" />
        {layers.map(l => (
          <g key={l.id}>
            <rect x={0} y={l.y * ms} width={MINIMAP_W} height={l.height * ms} fill={l.bg} />
            <rect x={0} y={l.y * ms} width={MINIMAP_W} height={Math.max(0.5, 2 * ms)} fill={l.color} opacity={0.6} />
          </g>
        ))}
        {nodes.map(n => (
          <rect key={n.id}
            x={n.x * ms} y={n.y * ms}
            width={Math.max(2, nodeW * ms)} height={Math.max(1, nodeH * ms)}
            fill={n.color} opacity={0.55} rx={0.5}
          />
        ))}
        <rect
          x={vpX} y={vpY}
          width={Math.max(4, vpW)} height={Math.max(4, vpH)}
          fill="rgba(37,99,235,0.08)"
          stroke="#547A95" strokeWidth={1.5}
          strokeDasharray="3,2"
          style={{ cursor: 'move' }}
        />
      </svg>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArchMap({ nodes, edges, selectedNode, onNodeClick, layers, canvasW, canvasH, nodeW, nodeH }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [zoomTransform, setZoomTransform] = useState({ k: 1, x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  const rLane = canvasW - 18;

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
      const scale = Math.min(W / canvasW, H / canvasH) * 0.9;
      const tx = (W - canvasW * scale) / 2;
      const ty = (H - canvasH * scale) / 2 + 10;
      d3.select(svgEl).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    };

    fit();
    window.addEventListener('resize', fit);
    return () => {
      d3.select(svgEl).on('.zoom', null);
      window.removeEventListener('resize', fit);
    };
  }, [canvasW, canvasH]);

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
    const scale = Math.min(W / canvasW, H / canvasH) * 0.9;
    const tx = (W - canvasW * scale) / 2;
    const ty = (H - canvasH * scale) / 2 + 10;
    d3.select(svgEl).transition().duration(250)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }, [canvasW, canvasH]);

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
  const layerMap = useMemo(() => Object.fromEntries(layers.map(l => [l.id, l])), [layers]);

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
    <div className="w-full h-full relative" style={{ background: '#E8EDF2' }}>
      <svg ref={svgRef} className="w-full h-full" style={{ display: 'block' }}>
        <defs>
          <marker id="arr-main" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="rgba(44,57,71,0.65)" />
          </marker>
          <marker id="arr-sec" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
            <polygon points="0 0, 5 2, 0 4" fill="rgba(44,57,71,0.35)" />
          </marker>
        </defs>
        <g ref={gRef}>
          <rect x={0} y={0} width={canvasW} height={canvasH} fill="#E8EDF2" />
          {layers.map(layer => <LayerBand key={layer.id} layer={layer} canvasW={canvasW} />)}
          {edges.map(edge => {
            const isConnectedEdge = hasSelection &&
              activeIds.has(edge.source) && activeIds.has(edge.target);
            const dimmed = hasSelection && !isConnectedEdge;
            return (
              <EdgePath key={`${edge.source}→${edge.target}`}
                edge={edge} nodeMap={nodeMap} layerMap={layerMap} dimmed={dimmed}
                nodeW={nodeW} nodeH={nodeH} rLane={rLane} />
            );
          })}
          {nodes.map(node => (
            <NodeBox key={node.id} node={node}
              isSelected={selectedNode?.id === node.id}
              isConnected={connectedIds.has(node.id)}
              isHovered={hovered === node.id}
              hasSelection={hasSelection}
              onClick={onNodeClick} onHover={handleHover}
              nodeW={nodeW} nodeH={nodeH} />
          ))}
        </g>
      </svg>

      {/* Top-right controls: zoom + minimap */}
      <div className="absolute top-3 right-3 flex flex-col gap-2" style={{ zIndex: 10 }}>
        <div
          className="flex items-center gap-1"
          style={{
            background: '#ffffff', border: '1px solid #C5CFD8',
            borderRadius: 6, padding: '3px 4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <button
            onClick={() => changeZoom(1 / 1.3)}
            className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
            style={{ width: 22, height: 22, fontSize: 16, color: '#547A95', lineHeight: 1 }}
          >−</button>
          <button
            onClick={resetZoom}
            className="hover:bg-black/5 rounded transition-colors"
            style={{ minWidth: 48, height: 22, fontSize: 11, fontFamily: "'Nunito', sans-serif", color: '#2C3947', textAlign: 'center' }}
          >{zoomPct}%</button>
          <button
            onClick={() => changeZoom(1.3)}
            className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
            style={{ width: 22, height: 22, fontSize: 16, color: '#547A95', lineHeight: 1 }}
          >+</button>
        </div>

        <Minimap
          transform={zoomTransform}
          svgW={svgSize.w} svgH={svgSize.h}
          nodes={nodes}
          onApplyTransform={handleApplyTransform}
          onFit={resetZoom}
          layers={layers}
          canvasW={canvasW} canvasH={canvasH}
          nodeW={nodeW} nodeH={nodeH}
        />
      </div>
    </div>
  );
}
