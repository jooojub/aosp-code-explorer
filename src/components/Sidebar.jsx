import { useState } from 'react';
import { Menu } from 'lucide-react';
import { NODES } from '../data/cameraData';

const LAYER_ORDER = ['app', 'java', 'native', 'service', 'hal_if', 'hal_impl', 'kernel', 'hw'];

const LAYER_META = {
  app:      { label: 'Application',          color: '#16a34a' },
  java:     { label: 'Java API',             color: '#2563eb' },
  native:   { label: 'NDK / Native',         color: '#4f46e5' },
  service:  { label: 'CameraService',        color: '#7c3aed' },
  hal_if:   { label: 'HAL AIDL Interface',   color: '#d97706' },
  hal_impl: { label: 'HAL Implementation',   color: '#ea580c' },
  kernel:   { label: 'Kernel / Drivers',     color: '#9333ea' },
  hw:       { label: 'Hardware',             color: '#dc2626' },
};

export default function Sidebar({ selectedNode, onNodeClick, search, open, onToggle }) {
  const [collapsed, setCollapsed] = useState(new Set());

  const toggle = (id) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const groups = LAYER_ORDER.reduce((acc, layerId) => {
    acc[layerId] = NODES.filter(n => n.layer === layerId);
    return acc;
  }, {});

  const filteredGroups = LAYER_ORDER.reduce((acc, layerId) => {
    const filtered = search
      ? groups[layerId].filter(n =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.path.toLowerCase().includes(search.toLowerCase())
        )
      : groups[layerId];
    if (filtered.length > 0) acc[layerId] = filtered;
    return acc;
  }, {});

  if (!open) {
    return (
      <aside
        className="flex-shrink-0 flex flex-col border-r"
        style={{ width: 40, borderColor: '#d0d7de', background: '#f6f8fa' }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center hover:bg-black/5 transition-colors"
          style={{ width: 40, height: 36, color: '#57606a' }}
          title="Show sidebar"
        >
          <Menu size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col border-r overflow-hidden"
      style={{ borderColor: '#d0d7de', background: '#f6f8fa' }}
    >
      {/* Legend header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#d0d7de' }}>
        <p className="text-xs font-semibold" style={{ color: '#57606a', fontFamily: 'monospace' }}>
          LAYERS
        </p>
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded hover:bg-black/5 transition-colors"
          style={{ width: 22, height: 22, color: '#57606a' }}
          title="Hide sidebar"
        >
          <Menu size={13} />
        </button>
      </div>

      {/* Layer groups */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(filteredGroups).map(([layerId, layerNodes]) => {
          const meta = LAYER_META[layerId];
          const isCollapsed = collapsed.has(layerId);
          return (
            <div key={layerId}>
              {/* Layer header */}
              <button
                onClick={() => toggle(layerId)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-black/5 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: meta.color }}
                />
                <span
                  className="text-xs font-semibold flex-1 truncate"
                  style={{ color: meta.color, fontFamily: 'monospace' }}
                >
                  {meta.label}
                </span>
                <span className="text-xs" style={{ color: '#6e7781', fontFamily: 'monospace' }}>
                  {layerNodes.length}
                </span>
                <span style={{ color: '#6e7781', fontSize: 10 }}>
                  {isCollapsed ? '▶' : '▼'}
                </span>
              </button>

              {/* Node list */}
              {!isCollapsed && (
                <div className="pb-1">
                  {layerNodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => onNodeClick(node)}
                        className="block w-full text-left px-5 py-1 text-xs truncate transition-colors hover:bg-black/5"
                        style={{
                          fontFamily: 'monospace',
                          color: isSelected ? node.color : '#24292f',
                          background: isSelected ? node.color + '18' : 'transparent',
                          borderLeft: isSelected ? `2px solid ${node.color}` : '2px solid transparent',
                          paddingLeft: isSelected ? 18 : 20,
                          fontWeight: isSelected ? '600' : '400',
                        }}
                      >
                        {node.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend for edge types */}
      <div className="px-3 py-2 border-t" style={{ borderColor: '#d0d7de' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#57606a', fontFamily: 'monospace' }}>
          CONNECTIONS
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
              <polygon points="16,1 22,4 16,7" fill="rgba(0,0,0,0.5)" />
            </svg>
            <span className="text-xs" style={{ color: '#57606a', fontFamily: 'monospace' }}>Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
              <polygon points="16,2 21,4 16,6" fill="rgba(0,0,0,0.25)" />
            </svg>
            <span className="text-xs" style={{ color: '#57606a', fontFamily: 'monospace' }}>Secondary</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
