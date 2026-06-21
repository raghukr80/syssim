import { useDiagramStore } from '../../stores/diagramStore'

export function StatusBar() {
  const store = useDiagramStore()
  const { systemMetrics, simState } = store

  const fmtRps = (rps: number) => {
    if (rps >= 1000000) return `${(rps / 1000000).toFixed(1)}M`
    if (rps >= 1000) return `${(rps / 1000).toFixed(1)}K`
    return rps.toFixed(0)
  }

  const fmtLatency = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${ms.toFixed(0)}ms`
  }

  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`

  return (
    <div className="h-8 bg-surface border-t border-border flex items-center px-4 gap-6 text-xs shrink-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          simState === 'running' ? 'bg-success animate-pulse' :
          simState === 'paused' ? 'bg-warning' :
          simState === 'stopped' ? 'bg-error' : 'bg-text-dim'
        }`} />
        <span className="text-text-dim">Status</span>
        <span className="text-text font-medium capitalize">{simState}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-text-dim">RPS</span>
        <span className="text-text font-mono">{fmtRps(systemMetrics.totalRps)}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-text-dim">P99</span>
        <span className={`font-mono ${systemMetrics.systemP99 > 500 ? 'text-error' : systemMetrics.systemP99 > 200 ? 'text-warning' : 'text-text'}`}>
          {fmtLatency(systemMetrics.systemP99)}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-text-dim">Errors</span>
        <span className={`font-mono ${systemMetrics.errorRate > 0.05 ? 'text-error' : systemMetrics.errorRate > 0.01 ? 'text-warning' : 'text-success'}`}>
          {fmtPct(systemMetrics.errorRate)}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-text-dim">Bottlenecks</span>
        <span className={`font-mono ${systemMetrics.bottleneckCount > 0 ? 'text-warning' : 'text-text'}`}>
          {systemMetrics.bottleneckCount}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-text-dim">Chaos</span>
        <span className={`font-mono ${store.activeChaos.length > 0 ? 'text-error' : 'text-text'}`}>
          {store.activeChaos.length}
        </span>
      </div>

      <div className="flex-1" />

      <span className="text-text-dim">
        {store.nodes.length} nodes · {store.edges.length} edges
      </span>
    </div>
  )
}
