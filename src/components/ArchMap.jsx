import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { CANVAS_W, CANVAS_H, NODE_W, NODE_H, DOMAINS, LAYERS } from '../data/cameraData';

function edgePath(src, tgt) {
  const sameLayer = src.layer === tgt.layer;
  if (sameLayer) {
    const sx = src.x + NODE_W;
    const sy = src.y + NODE_H / 2;
    const tx = tgt.x;
    const ty = tgt.y + NODE_H / 2;
    const mx = (sx + tx) / 2;
    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  }
  const sx = src.x + NODE_W / 2;
  const sy = src.y + NODE_H;
  const tx = tgt.x + NODE_W / 2;
  const ty = tgt.y;
  const dy = Math.abs(ty - sy);
  const off = Math.max(50, dy * 0.45);
  return `M${sx},${sy} C${sx},${sy + off} ${tx},${ty - off} ${tx},${ty}`;
}

function LayerBand({ layer }) {
  return (
    <g>
      <rect x={0} y={layer.y} width={CANVAS_W} height={layer.height} fill={layer.bg} />
      <rect x={0} y={layer.y} width={CANVAS_W} height={1} fill={layer.color} opacity={0.25} />
      <rect x={0} y={layer.y + layer.height - 1} width={CANVAS_W} height={1} fill={layer.color} opacity={0.25} />
      <text
        x={10} y={layer.y + layer.height / 2}
        fill={layer.color} fontSize={9} fontFamily="'JetBrains Mono',monospace"
        fontWeight="600" dominantBaseline="middle" opacity={0.55}
        style={{ userSelect: 'none' }}
      >
        {layer.name}
      </text>
    </g>
  );
}

function EdgePath({ edge, nodeMap, dimmed }) {
  const src = nodeMap[edge.source];
  const tgt = nodeMap[edge.target];
  if (!src || !tgt) return null;
  const d = edgePath(src, tgt);
  const opacity = dimmed ? 0.06 : (edge.important ? 0.55 : 0.2);
  const strokeW = edge.important ? 1.4 : 0.8;
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
        fill={isSelected ? node.color + '18' : (isHovered ? '#eaf0f6' : '#ffffff')}
        stroke={bright || isHovered ? node.color : node.color + '55'}
        strokeWidth={isSelected ? 1.5 : (isConnected ? 1.1 : 0.7)}
      />
      <text
        x={NODE_W / 2} y={NODE_H / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill={bright ? node.color : node.color + 'bb'}
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
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    const gEl = gRef.current;
    if (!svgEl || !gEl) return;

    const zoom = d3.zoom()
      .scaleExtent([0.07, 5])
      .on('zoom', (event) => {
        d3.select(gEl).attr('transform', event.transform);
      });

    d3.select(svgEl).call(zoom);

    // Fit canvas to container on mount
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

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map(n => [n.id, n])),
    [nodes]
  );

  const connectedIds = useMemo(() => {
    if (!selectedNode) return new Set();
    const s = new Set();
    edges.forEach(e => {
      if (e.source === selectedNode.id) s.add(e.target);
      if (e.target === selectedNode.id) s.add(e.source);
    });
    return s;
  }, [selectedNode, edges]);

  const hasSelection = !!selectedNode;

  const handleHover = useCallback((id) => setHovered(id), []);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: '#f6f8fa', display: 'block' }}
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
        {/* Canvas background */}
        <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#f6f8fa" />

        {/* Domain column headers */}
        {DOMAINS.map((d, i) => (
          <g key={d.label}>
            {i > 0 && (
              <line
                x1={d.x1} y1={0} x2={d.x1} y2={CANVAS_H}
                stroke="#d0d7de" strokeWidth={1} strokeDasharray="3,6"
              />
            )}
            <text
              x={d.cx} y={11} textAnchor="middle"
              fill="#57606a" fontSize={9} fontFamily="'JetBrains Mono',monospace"
              fontWeight="500" style={{ userSelect: 'none' }}
            >
              {d.label}
            </text>
          </g>
        ))}

        {/* Layer bands */}
        {LAYERS.map(layer => <LayerBand key={layer.id} layer={layer} />)}

        {/* Edges */}
        {edges.map(edge => {
          const src = nodeMap[edge.source];
          const tgt = nodeMap[edge.target];
          const isConnectedEdge = hasSelection && (
            edge.source === selectedNode?.id || edge.target === selectedNode?.id
          );
          const dimmed = hasSelection && !isConnectedEdge;
          return (
            <EdgePath
              key={`${edge.source}→${edge.target}`}
              edge={edge} nodeMap={nodeMap} dimmed={dimmed}
            />
          );
        })}

        {/* Nodes */}
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
  );
}
