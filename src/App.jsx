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
      style={{ borderColor: '#C5CFD8', background: '#E8EDF2', height: 40 }}
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
              fontFamily: "'Nunito', sans-serif",
              cursor: mod.ready ? 'pointer' : 'default',
              background: isActive ? '#ffffff' : 'transparent',
              color: isActive ? mod.color : mod.ready ? '#547A95' : '#9BAEBB',
              border: isActive ? `1px solid ${mod.color}44` : '1px solid transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
            }}
          >
            <Icon size={12} />
            {mod.label}
            {!mod.ready && (
              <span
                className="text-xs px-1 rounded"
                style={{ fontSize: 9, background: '#DFE8EE', color: '#7A96A8', fontFamily: "'Nunito', sans-serif" }}
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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#E8EDF2', color: '#2C3947' }}>

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-4 h-11 border-b"
        style={{ borderColor: '#C5CFD8', background: '#E8EDF2' }}
      >
        <div className="flex items-center gap-2">
          <Layers size={15} style={{ color: '#547A95' }} />
          <span className="text-xs font-bold" style={{ color: '#547A95', fontFamily: "'Nunito', sans-serif" }}>AOSP</span>
          <span className="text-xs" style={{ color: '#7A96A8', fontFamily: "'Nunito', sans-serif" }}>/</span>
          <span className="text-xs font-semibold" style={{ color: '#2C3947', fontFamily: "'Nunito', sans-serif" }}>
            Camera Framework Explorer
          </span>
        </div>

        <div className="flex-1" />

        <span className="text-xs hidden md:block" style={{ color: '#7A96A8', fontFamily: "'Nunito', sans-serif" }}>
          scroll to zoom · drag to pan · click node to inspect
        </span>

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#7A96A8' }} />
          <input
            type="text"
            placeholder="Search components…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 pr-7 py-1 text-xs rounded outline-none"
            style={{
              background: '#F0F4F8',
              border: '1px solid #C5CFD8',
              color: '#2C3947',
              fontFamily: "'Nunito', sans-serif",
              width: 220,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#547A95')}
            onBlur={e => (e.target.style.borderColor = '#C5CFD8')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: '#7A96A8' }}
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
                background: '#DFE8EE',
                border: '1px solid #C5CFD8',
                color: '#547A95',
                fontFamily: "'Nunito', sans-serif",
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
