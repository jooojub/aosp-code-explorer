import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { CANVAS_W, CANVAS_H, NODE_W, NODE_H, LAYERS, LEFT_PAD } from '../data/cameraData';

// Right-side routing lane (outside all node columns)
const R_LANE = CANVAS_W - 18;

function edgePath(src, tgt, layerMap) {
  // Same layer, same row: horizontal S-curve between nodes
  if (src.layer === tgt.layer && src.y === tgt.y) {
    const sx = src.x + NODE_W, sy = src.y + NODE_H / 2;
    const tx = tgt.x,          ty = tgt.y + NODE_H / 2;
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  }

  // Same layer, different row: arc through right margin to avoid overlapping nodes
  if (src.layer === tgt.layer) {
    const sx = src.x + NODE_W, sy = src.y + NODE_H / 2;
    const tx = tgt.x + NODE_W, ty = tgt.y + NODE_H / 2;
    return `M${sx},${sy} C${R_LANE},${sy} ${R_LANE},${ty} ${tx},${ty}`;
  }

  // Cross-layer: anchor control points inside layer boundary clear zones
  // so the horizontal drift happens in padding/label areas, not through node rows.
  const srcL = layerMap[src.layer];
  const tgtL = layerMap[tgt.layer];
  const goDown = tgtL.y > srcL.y;
  const sx = src.x + NODE_W / 2;
  const tx = tgt.x + NODE_W / 2;

  if (goDown) {
    const sy = src.y + NODE_H;         // exit bottom center
    const ty = tgt.y;                  // enter top center
    const c1y = srcL.y + srcL.height - 6;  // src layer bottom padding
    const c2y = tgtL.y + 20;               // tgt layer label area
    return `M${sx},${sy} C${sx},${c1y} ${tx},${c2y} ${tx},${ty}`;
  } else {
    const sy = src.y;                  // exit top center
    const ty = tgt.y + NODE_H;        // enter bottom center
    const c1y = srcL.y + 20;               // src layer label area
    const c2y = tgtL.y + tgtL.height - 6;  // tgt layer bottom padding
    return `M${sx},${sy} C${sx},${c1y} ${tx},${c2y} ${tx},${ty}`;
  }
}

function LayerBand({ layer }) {
  return (
    <g>
      <rect x={0} y={layer.y} width={CANVAS_W} height={layer.height} fill={layer.bg} />
      <rect x={0} y={layer.y} width={CANVAS_W} height={2} fill={layer.color} opacity={0.6} />
      <rect x={0} y={layer.y + layer.height - 1} width={CANVAS_W} height={1} fill={layer.color} opacity={0.25} />
      <text
        x={10} y={layer.y + 23}
        fill={layer.color} fontSize={13} fontFamily="'JetBrains Mono',monospace"
        fontWeight="700" dominantBaseline="middle" opacity={1}
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
  const color = edge.important ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,1)';
  return (
    <path
      d={d} fill="none"
      stroke={color} strokeWidth={strokeW} strokeOpacity={opacity}
      markerEnd={edge.important ? 'url(#arr-main)' : 'url(#arr-sec)'}
    />
  );
}

function NodeBox({ node, isSelected, isConnected, isHovered, hasSelection, onClick, onHover }) {
  const dimmed = hasSelection && !isSelected && !isConnected;
  const bright = isSelected || isConnected;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onClick={() => onClick(node)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
      opacity={dimmed ? 0.2 : 1}
    >
      {/* Glow behind selected */}
      {isSelected && (
        <rect
          x={-3} y={-3} width={NODE_W + 6} height={NODE_H + 6} rx={6}
          fill={node.color} opacity={0.15}
        />
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
        fill={node.color}
        fontSize={9.5} fontFamily="'JetBrains Mono',monospace"
        fontWeight={isSelected ? '700' : '500'}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {node.label}
      </text>
    </g>
  );
}

export default function ArchMap({ nodes, edges, selectedNode, onNodeClick }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [zoomPct, setZoomPct] = useState(100);

  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl) return;

    const zoom = d3.zoom()
      .scaleExtent([0.07, 5])
      .on('zoom', (event) => {
        d3.select(gEl).attr('transform', event.transform);
        setZoomPct(Math.round(event.transform.k * 100));
      });

    zoomRef.current = zoom;
    d3.select(svgEl).call(zoom);

    const fit = () => {
      const { clientWidth: W, clientHeight: H } = svgEl;
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

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map(n => [n.id, n])),
    [nodes]
  );

  const layerMap = useMemo(
    () => Object.fromEntries(LAYERS.map(l => [l.id, l])),
    []
  );

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
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      >
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
              <EdgePath
                key={`${edge.source}→${edge.target}`}
                edge={edge} nodeMap={nodeMap} layerMap={layerMap} dimmed={dimmed}
              />
            );
          })}
          {nodes.map(node => (
            <NodeBox
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              isConnected={connectedIds.has(node.id)}
              isHovered={hovered === node.id}
              hasSelection={hasSelection}
              onClick={onNodeClick}
              onHover={handleHover}
            />
          ))}
        </g>
      </svg>

      {/* Zoom controls */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1"
        style={{
          background: '#ffffff',
          border: '1px solid #d0d7de',
          borderRadius: 6,
          padding: '3px 4px',
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
          style={{
            minWidth: 48, height: 22, fontSize: 11,
            fontFamily: 'monospace', color: '#24292f', textAlign: 'center',
          }}
        >{zoomPct}%</button>
        <button
          onClick={() => changeZoom(1.3)}
          className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
          style={{ width: 22, height: 22, fontSize: 16, color: '#57606a', lineHeight: 1 }}
        >+</button>
      </div>
    </div>
  );
}
