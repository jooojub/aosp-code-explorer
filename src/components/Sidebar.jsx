import { useState } from 'react';
import { Menu } from 'lucide-react';
import { NODES } from '../data/cameraData';

const LAYER_ORDER = ['app', 'java', 'native', 'service', 'hal_if', 'hal_impl', 'kernel', 'hw'];

const LAYER_META = {
  app:      { label: 'Application',          color: '#2563EB' },
  java:     { label: 'Java API',             color: '#7C3AED' },
  native:   { label: 'NDK / Native',         color: '#0891B2' },
  service:  { label: 'CameraService',        color: '#334155' },
  hal_if:   { label: 'HAL AIDL Interface',   color: '#EA580C' },
  hal_impl: { label: 'HAL Implementation',   color: '#DC2626' },
  kernel:   { label: 'Kernel / Drivers',     color: '#16A34A' },
  hw:       { label: 'Hardware',             color: '#DB2777' },
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
        style={{ width: 40, borderColor: '#C5CFD8', background: '#E8EDF2' }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center hover:bg-black/5 transition-colors"
          style={{ width: 40, height: 36, color: '#547A95' }}
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
      style={{ borderColor: '#C5CFD8', background: '#E8EDF2' }}
    >
      {/* Legend header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#C5CFD8' }}>
        <p className="text-xs font-semibold" style={{ color: '#547A95', fontFamily: "'Nunito', sans-serif" }}>
          LAYERS
        </p>
        <button
          onClick={onToggle}
          className="flex items-center justify-center rounded hover:bg-black/5 transition-colors"
          style={{ width: 22, height: 22, color: '#547A95' }}
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
                  style={{ color: meta.color, fontFamily: "'Nunito', sans-serif" }}
                >
                  {meta.label}
                </span>
                <span className="text-xs" style={{ color: '#7A96A8', fontFamily: "'Nunito', sans-serif" }}>
                  {layerNodes.length}
                </span>
                <span style={{ color: '#7A96A8', fontSize: 10 }}>
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
                          fontFamily: "'Nunito', sans-serif",
                          color: isSelected ? node.color : '#2C3947',
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
      <div className="px-3 py-2 border-t" style={{ borderColor: '#C5CFD8' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#547A95', fontFamily: "'Nunito', sans-serif" }}>
          CONNECTIONS
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(44,57,71,0.6)" strokeWidth="1.5" />
              <polygon points="16,1 22,4 16,7" fill="rgba(44,57,71,0.65)" />
            </svg>
            <span className="text-xs" style={{ color: '#547A95', fontFamily: "'Nunito', sans-serif" }}>Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="24" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke="rgba(44,57,71,0.25)" strokeWidth="0.8" />
              <polygon points="16,2 21,4 16,6" fill="rgba(44,57,71,0.3)" />
            </svg>
            <span className="text-xs" style={{ color: '#547A95', fontFamily: "'Nunito', sans-serif" }}>Secondary</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
