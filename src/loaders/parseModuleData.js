export function parseModuleData(json) {
  const { layout, layers, nodes, edges } = json;
  const {
    canvasWidth, nodeWidth, nodeHeight,
    nodesPerRow, gapX, gapY, layerPadTop, layerPadBottom,
  } = layout;

  const leftPad = Math.round((canvasWidth - (nodesPerRow * (nodeWidth + gapX) - gapX)) / 2);

  const colorByLayer = Object.fromEntries(layers.map(l => [l.id, l.color]));

  let currentY = 0;
  const countByLayer = {};
  for (const n of nodes) countByLayer[n.layer] = (countByLayer[n.layer] || 0) + 1;

  const layerYMap = {};
  const processedLayers = layers.map(l => {
    const count = countByLayer[l.id] || 0;
    const rows = Math.max(1, Math.ceil(count / nodesPerRow));
    const height = layerPadTop + rows * nodeHeight + (rows - 1) * gapY + layerPadBottom;
    layerYMap[l.id] = currentY;
    const layer = { ...l, y: currentY, height };
    currentY += height;
    return layer;
  });

  const idxByLayer = {};
  const processedNodes = nodes.map(n => {
    const idx = idxByLayer[n.layer] || 0;
    idxByLayer[n.layer] = idx + 1;
    const col = idx % nodesPerRow;
    const row = Math.floor(idx / nodesPerRow);
    return {
      ...n,
      color: colorByLayer[n.layer],
      x: leftPad + col * (nodeWidth + gapX),
      y: layerYMap[n.layer] + layerPadTop + row * (nodeHeight + gapY),
    };
  });

  return {
    CANVAS_W: canvasWidth,
    CANVAS_H: currentY,
    NODE_W: nodeWidth,
    NODE_H: nodeHeight,
    LEFT_PAD: leftPad,
    LAYERS: processedLayers,
    NODES: processedNodes,
    EDGES: edges,
  };
}
