import { useMemo } from 'react';
import { X, Folder, File, ArrowRight, ArrowLeft, Link } from 'lucide-react';
import { NODES, EDGES, LAYERS } from '../data/cameraData';

const LAYER_META = {
  app:      { label: 'Application',         color: '#547A95' },
  java:     { label: 'Java API',            color: '#4A7090' },
  native:   { label: 'NDK / Native',        color: '#3D6478' },
  service:  { label: 'CameraService',       color: '#2C3947' },
  hal_if:   { label: 'HAL AIDL Interface',  color: '#C2A56D' },
  hal_impl: { label: 'HAL Implementation',  color: '#A8895A' },
  kernel:   { label: 'Kernel / Drivers',    color: '#6B8FA5' },
  hw:       { label: 'Hardware',            color: '#4A5F6E' },
};

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold mb-2 tracking-widest" style={{ color: '#547A95', fontFamily: 'monospace' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function DetailPanel({ node, onClose, onNodeClick }) {
  const nodeMap = useMemo(() => Object.fromEntries(NODES.map(n => [n.id, n])), []);

  const outgoing = useMemo(() =>
    EDGES.filter(e => e.source === node.id).map(e => ({ ...e, peer: nodeMap[e.target] })).filter(e => e.peer),
    [node.id, nodeMap]
  );

  const incoming = useMemo(() =>
    EDGES.filter(e => e.target === node.id).map(e => ({ ...e, peer: nodeMap[e.source] })).filter(e => e.peer),
    [node.id, nodeMap]
  );

  const meta = LAYER_META[node.layer];

  return (
    <aside
      className="w-80 flex-shrink-0 flex flex-col border-l overflow-hidden"
      style={{ borderColor: '#C5CFD8', background: '#E8EDF2' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b" style={{ borderColor: '#C5CFD8' }}>
        <div className="flex-1 min-w-0">
          <h2
            className="text-sm font-bold leading-tight break-words"
            style={{ color: node.color, fontFamily: 'monospace' }}
          >
            {node.label}
          </h2>
          <span
            className="inline-block mt-1 text-xs px-2 py-0.5 rounded"
            style={{
              background: node.color + '22',
              color: node.color,
              fontFamily: 'monospace',
              border: `1px solid ${node.color}44`,
            }}
          >
            {meta?.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0"
          style={{ color: '#547A95' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* Description */}
        {node.description && (
          <Section title="DESCRIPTION">
            <p className="text-xs leading-relaxed" style={{ color: '#547A95', fontFamily: 'monospace' }}>
              {node.description}
            </p>
          </Section>
        )}

        {/* Source path */}
        {node.path && (
          <Section title="SOURCE PATH">
            <div
              className="flex items-start gap-2 px-2 py-1.5 rounded text-xs break-all"
              style={{ background: '#F0F4F8', border: '1px solid #C5CFD8' }}
            >
              <Folder size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#C2A56D' }} />
              <span style={{ color: '#2C3947', fontFamily: 'monospace' }}>{node.path}</span>
            </div>
          </Section>
        )}

        {/* Key files */}
        {node.files && node.files.length > 0 && (
          <Section title="KEY FILES">
            <div className="flex flex-col gap-1">
              {node.files.map(f => (
                <div
                  key={f}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                  style={{ background: '#F0F4F8', border: '1px solid #C5CFD8' }}
                >
                  <File size={11} className="flex-shrink-0" style={{ color: '#547A95' }} />
                  <span className="truncate" style={{ color: '#547A95', fontFamily: 'monospace' }}>{f}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Outgoing connections */}
        {outgoing.length > 0 && (
          <Section title="CALLS / DEPENDS ON">
            <div className="flex flex-col gap-1">
              {outgoing.map(e => (
                <button
                  key={e.target}
                  onClick={() => onNodeClick(e.peer)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors hover:bg-black/5 w-full"
                  style={{ border: '1px solid #C5CFD8', background: '#F0F4F8' }}
                >
                  <ArrowRight size={11} className="flex-shrink-0" style={{ color: e.peer.color }} />
                  <span className="flex-1 truncate font-medium" style={{ color: e.peer.color, fontFamily: 'monospace' }}>
                    {e.peer.label}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: '#7A96A8', fontFamily: 'monospace' }}>
                    {e.label}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Incoming connections */}
        {incoming.length > 0 && (
          <Section title="CALLED BY">
            <div className="flex flex-col gap-1">
              {incoming.map(e => (
                <button
                  key={e.source}
                  onClick={() => onNodeClick(e.peer)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors hover:bg-black/5 w-full"
                  style={{ border: '1px solid #C5CFD8', background: '#F0F4F8' }}
                >
                  <ArrowLeft size={11} className="flex-shrink-0" style={{ color: e.peer.color }} />
                  <span className="flex-1 truncate font-medium" style={{ color: e.peer.color, fontFamily: 'monospace' }}>
                    {e.peer.label}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: '#7A96A8', fontFamily: 'monospace' }}>
                    {e.label}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
}
