import { useState, useMemo } from 'react';
import { Search, X, Layers } from 'lucide-react';
import ArchMap from './components/ArchMap';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import { NODES, EDGES } from './data/cameraData';
import { MODULES } from './data/modules';
import './App.css';

function ModuleTabs({ active, onChange }) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-1 px-3 border-b"
      style={{ borderColor: '#d0d7de', background: '#f6f8fa', height: 40 }}
    >
      {MODULES.map(mod => {
        const Icon = mod.icon;
        const isActive = active === mod.id;
        return (
          <button
            key={mod.id}
            onClick={() => mod.ready && onChange(mod.id)}
            className="relative flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              fontFamily: 'monospace',
              cursor: mod.ready ? 'pointer' : 'default',
              background: isActive ? '#ffffff' : 'transparent',
              color: isActive ? mod.color : mod.ready ? '#57606a' : '#b0b8c1',
              border: isActive ? `1px solid ${mod.color}44` : '1px solid transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
            }}
          >
            <Icon size={12} />
            {mod.label}
            {!mod.ready && (
              <span
                className="text-xs px-1 rounded"
                style={{ fontSize: 9, background: '#eaf0f6', color: '#8c959f', fontFamily: 'monospace' }}
              >
                soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState('');
  const [activeModule, setActiveModule] = useState('camera');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNodeClick = (node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  };

  const handleClose = () => setSelectedNode(null);

  const visibleNodes = useMemo(() => {
    if (!search) return NODES;
    const q = search.toLowerCase();
    return NODES.map(n => ({
      ...n,
      _dimmed: !n.label.toLowerCase().includes(q) && !n.path.toLowerCase().includes(q),
    }));
  }, [search]);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#ffffff', color: '#1f2328' }}>

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 h-11 border-b"
        style={{ borderColor: '#d0d7de', background: '#ffffff' }}
      >
        <div className="flex items-center gap-2">
          <Layers size={15} style={{ color: '#0969da' }} />
          <span className="text-xs font-bold" style={{ color: '#0969da', fontFamily: 'monospace' }}>AOSP</span>
          <span className="text-xs" style={{ color: '#57606a', fontFamily: 'monospace' }}>/</span>
          <span className="text-xs font-semibold" style={{ color: '#1f2328', fontFamily: 'monospace' }}>
            Camera Framework Explorer
          </span>
        </div>

        <div className="flex-1" />

        <span className="text-xs hidden md:block" style={{ color: '#6e7781', fontFamily: 'monospace' }}>
          scroll to zoom · drag to pan · click node to inspect
        </span>

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#57606a' }} />
          <input
            type="text"
            placeholder="Search components…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 pr-7 py-1 text-xs rounded outline-none"
            style={{
              background: '#f6f8fa',
              border: '1px solid #d0d7de',
              color: '#1f2328',
              fontFamily: 'monospace',
              width: 220,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#0969da')}
            onBlur={e => (e.target.style.borderColor = '#d0d7de')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: '#57606a' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </header>

      {/* Module tabs */}
      <ModuleTabs active={activeModule} onChange={(id) => { setActiveModule(id); setSelectedNode(null); setSearch(''); }} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedNode={selectedNode}
          onNodeClick={handleNodeClick}
          search={search}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
        />

        <main className="flex-1 overflow-hidden relative">
          <ArchMap
            nodes={visibleNodes}
            edges={EDGES}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
          />
          {!selectedNode && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full pointer-events-none"
              style={{
                background: '#eaf0f6',
                border: '1px solid #d0d7de',
                color: '#6e7781',
                fontFamily: 'monospace',
              }}
            >
              Click any node to inspect
            </div>
          )}
        </main>

        {selectedNode && (
          <DetailPanel node={selectedNode} onClose={handleClose} onNodeClick={handleNodeClick} />
        )}
      </div>
    </div>
  );
}
