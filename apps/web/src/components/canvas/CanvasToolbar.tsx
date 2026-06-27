import { useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { Lightbulb, StickyNote, Route, X, ChevronRight, RotateCcw } from 'lucide-react'

type ToolbarMode = null | 'suggestions' | 'notes' | 'trace'

// ─── Toolbar Buttons (for Controls panel) ──
export function CanvasToolbarButtons() {
  const store = useDiagramStore()
  const [mode, setMode] = useState<ToolbarMode>(null)

  const toggle = (m: ToolbarMode) => {
    const newMode = mode === m ? null : m
    setMode(newMode)
    if (m === 'trace' && newMode === 'trace') {
      store.setTraceMode(true)
    } else if (m === 'trace' && newMode !== 'trace') {
      store.setTraceMode(false)
      store.clearTrace()
    }
  }

  const isTraceActive = mode === 'trace' && store.tracePath.length > 0

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => toggle('suggestions')}
          className={`p-1.5 rounded transition-all ${
            mode === 'suggestions'
              ? 'bg-accent text-white'
              : 'text-text-dim hover:text-text hover:bg-surface-hover'
          }`}
          title="Suggestions"
        >
          <Lightbulb className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => toggle('notes')}
          className={`p-1.5 rounded transition-all ${
            mode === 'notes'
              ? 'bg-accent text-white'
              : 'text-text-dim hover:text-text hover:bg-surface-hover'
          }`}
          title="Architecture Notes"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => toggle('trace')}
          className={`p-1.5 rounded transition-all ${
            mode === 'trace'
              ? 'bg-accent text-white'
              : 'text-text-dim hover:text-text hover:bg-surface-hover'
          }`}
          title="Trace Request Flow"
        >
          <Route className="w-3.5 h-3.5" />
        </button>
        {isTraceActive && (
          <button
            onClick={() => store.clearTrace()}
            className="p-1.5 rounded text-text-dim hover:text-error transition-all"
            title="Clear Trace"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Trace breadcrumb at top */}
      {isTraceActive && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-surface/95 border border-border rounded-lg shadow-lg px-3 py-2 backdrop-blur-sm max-w-[80%] overflow-x-auto">
          {store.tracePath.map((nodeId, i) => {
            const node = store.nodes.find(n => n.id === nodeId)
            const label = node?.data.label || nodeId
            return (
              <div key={i} className="flex items-center gap-1 shrink-0">
                {i > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[8px] font-bold shrink-0">
                    {i}
                  </span>
                )}
                <span className={`text-[10px] font-medium ${i === 0 ? 'text-accent' : i === store.tracePath.length - 1 ? 'text-success' : 'text-text'}`}>
                  {label}
                </span>
                {i < store.tracePath.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-text-dim shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Suggestions panel */}
      {mode === 'suggestions' && (
        <SuggestionsPanel onClose={() => setMode(null)} />
      )}

      {/* Notes panel */}
      {mode === 'notes' && (
        <NotesPanel onClose={() => setMode(null)} />
      )}
    </>
  )
}

// ─── Suggestions Panel ──
function SuggestionsPanel({ onClose }: { onClose: () => void }) {
  const store = useDiagramStore()
  const nodes = store.nodes
  const edges = store.edges

  const suggestions = generateSuggestions(nodes, edges)

  return (
    <div className="absolute right-0 top-full mt-1 z-30 w-72 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text">Suggestions</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {suggestions.length === 0 ? (
          <p className="text-[10px] text-text-dim">No suggestions. Your architecture looks good!</p>
        ) : (
          suggestions.map((s, i) => (
            <div key={i} className={`p-2 rounded border text-[10px] ${
              s.severity === 'warning' ? 'border-warning/30 bg-warning/5 text-warning' :
              s.severity === 'error' ? 'border-error/30 bg-error/5 text-error' :
              'border-border bg-bg/50 text-text-dim'
            }`}>
              <div className="font-medium text-[10px] text-text">{s.title}</div>
              <div className="mt-0.5">{s.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Notes Panel ──
function NotesPanel({ onClose }: { onClose: () => void }) {
  const store = useDiagramStore()
  const [notes, setNotes] = useState(store.architectureNotes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    store.setArchitectureNotes(notes)
    setTimeout(() => setSaving(false), 500)
  }

  return (
    <div className="absolute right-0 top-full mt-1 z-30 w-72 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text">Architecture Notes</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes about your architecture design..."
          className="w-full h-32 text-[10px] text-text bg-bg border border-border rounded px-2 py-1.5 outline-none focus:border-accent resize-none"
        />
        <button
          onClick={handleSave}
          className="mt-2 w-full py-1.5 rounded text-[10px] font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          {saving ? 'Saved!' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}

// ─── Suggestion Generator ──
function generateSuggestions(nodes: any[], edges: any[]) {
  const suggestions: { title: string; message: string; severity: 'info' | 'warning' | 'error' }[] = []

  const connectedNodes = new Set<string>()
  edges.forEach(e => {
    connectedNodes.add(e.source)
    connectedNodes.add(e.target)
  })
  const isolated = nodes.filter(n => !connectedNodes.has(n.id))
  if (isolated.length > 0) {
    suggestions.push({
      title: 'Isolated Nodes',
      message: `${isolated.length} node(s) have no connections: ${isolated.map(n => n.data.label).join(', ')}`,
      severity: 'warning'
    })
  }

  const connectionCount: Record<string, number> = {}
  edges.forEach(e => {
    connectionCount[e.source] = (connectionCount[e.source] || 0) + 1
    connectionCount[e.target] = (connectionCount[e.target] || 0) + 1
  })
  const highTraffic = Object.entries(connectionCount).filter(([, c]) => c >= 4)
  if (highTraffic.length > 0) {
    suggestions.push({
      title: 'High Traffic Nodes',
      message: `${highTraffic.map(([id]) => nodes.find(n => n.id === id)?.data.label || id).join(', ')} have 4+ connections. Consider load balancing.`,
      severity: 'info'
    })
  }

  const hasLB = nodes.some(n => n.data.componentType === 'load_balancer')
  const hasServers = nodes.some(n => ['web_server', 'microservice', 'app_server', 'container_cluster'].includes(n.data.componentType))
  if (hasServers && !hasLB && nodes.length > 3) {
    suggestions.push({
      title: 'Missing Load Balancer',
      message: 'Your architecture has compute nodes but no load balancer. Consider adding one for high availability.',
      severity: 'warning'
    })
  }

  const hasDB = nodes.some(n => ['database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store'].includes(n.data.componentType))
  if (nodes.length > 2 && !hasDB) {
    suggestions.push({
      title: 'No Data Layer',
      message: 'Consider adding a database or cache layer for persistent data storage.',
      severity: 'info'
    })
  }

  if (edges.length > nodes.length && nodes.length > 2) {
    suggestions.push({
      title: 'Possible Circular Dependencies',
      message: `You have ${edges.length} connections for ${nodes.length} nodes. Review for unnecessary cycles.`,
      severity: 'info'
    })
  }

  return suggestions
}
