import { useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { BLUEPRINTS } from '../../types/blueprints'
import { X, LayoutTemplate } from 'lucide-react'

export function BlueprintPanel() {
  const [open, setOpen] = useState(false)
  const store = useDiagramStore()

  const handleLoad = (bp: typeof BLUEPRINTS[0]) => {
    store.loadBlueprint(bp.nodes, bp.edges)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button — rendered inside Toolbar via children */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors text-xs"
        title="Load a blueprint"
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span>Blueprints</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl w-[640px] max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-text">Architecture Blueprints</h2>
                <p className="text-xs text-text-dim mt-0.5">Pre-built templates to get started quickly</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Blueprint grid */}
            <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh]">
              {BLUEPRINTS.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => handleLoad(bp)}
                  className="text-left p-4 rounded-lg border border-border hover:border-accent/50 bg-bg/50 hover:bg-surface-hover transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{bp.icon}</span>
                    <span className="text-sm font-medium text-text group-hover:text-accent transition-colors">{bp.name}</span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed">{bp.description}</p>
                  <div className="mt-2 text-[10px] text-text-dim">
                    {bp.nodes.length} components · {bp.edges.length} connections
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
