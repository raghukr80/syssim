import { useDiagramStore } from '../../stores/diagramStore'

function getBottleneckReason(node: any): { reason: string; rec: string; severity: 'critical' | 'warning' | 'info' } | null {
  const m = node.data.metrics
  const config = node.data.config
  if (!m) return null

  if (m.utilization > 0.95) {
    return { reason: 'Severe overload — utilization >95%', rec: `Increase maxRps (currently ${config.maxRps}) or add horizontal replicas. Consider autoscaling.`, severity: 'critical' }
  }
  if (m.errorRate > 0.1) {
    return { reason: `High error rate ${(m.errorRate * 100).toFixed(1)}%`, rec: 'Check logs, add circuit breaker, or increase redundancy. Consider rollback if recent deploy.', severity: 'critical' }
  }
  if (m.p99Latency > config.latencyP99 * 4) {
    return { reason: `P99 latency ${(m.p99Latency / config.latencyP99).toFixed(1)}× above baseline`, rec: 'Profile slow queries, add caching layer, or scale vertically.', severity: 'critical' }
  }
  if (m.utilization > 0.8) {
    return { reason: 'High utilization >80%', rec: 'Enable autoscaling or increase instance count. Monitor for further degradation.', severity: 'warning' }
  }
  if (m.errorRate > 0.05) {
    return { reason: `Elevated error rate ${(m.errorRate * 100).toFixed(1)}%`, rec: 'Investigate error patterns. Add retry with backoff or circuit breaker.', severity: 'warning' }
  }
  if (m.p99Latency > config.latencyP99 * 2.5) {
    return { reason: `P99 latency ${(m.p99Latency / config.latencyP99).toFixed(1)}× above baseline`, rec: 'Add caching, optimize queries, or check downstream dependencies.', severity: 'warning' }
  }
  if ((m.queueDepth || 0) > 50) {
    return { reason: `Queue depth at ${m.queueDepth}`, rec: 'Scale consumers or add message partitioning to distribute load.', severity: 'warning' }
  }
  return null
}

function getSPOFBottlenecks(nodes: any[], edges: any[]) {
  const spofNodes = []
  const downstreamCounts: Record<string, string[]> = {}
  const upstreamCounts: Record<string, string[]> = {}

  for (const edge of edges) {
    if (!downstreamCounts[edge.source]) downstreamCounts[edge.source] = []
    downstreamCounts[edge.source].push(edge.target)
    if (!upstreamCounts[edge.target]) upstreamCounts[edge.target] = []
    upstreamCounts[edge.target].push(edge.source)
  }

  for (const node of nodes) {
    const config = node.data.config
    const m = node.data.metrics
    const down = downstreamCounts[node.id] || []
    const up = upstreamCounts[node.id] || []

    if (config.autoScale === false && config.minInstances <= 1) {
      const isCompute = ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql'].includes(node.data.componentType)
      if (isCompute && up.length > 0) {
        spofNodes.push({
          label: node.data.label,
          utilization: m?.utilization || 0,
          rps: m?.currentRps || 0,
          p99: m?.p99Latency || 0,
          errorRate: m?.errorRate || 0,
          status: node.data.status || 'idle',
          reason: 'Single instance — no autoscaling (SPOF)',
          recommendation: `Enable autoscaling with minInstances ≥ 2. Add redundancy to avoid full outage.`,
          severity: 'warning',
        })
      }
    }

    if (node.data.componentType === 'database' && (config.replicationFactor || 1) <= 1) {
      spofNodes.push({
        label: node.data.label,
        utilization: m?.utilization || 0,
        rps: m?.currentRps || 0,
        p99: m?.p99Latency || 0,
        errorRate: m?.errorRate || 0,
        status: node.data.status || 'idle',
        reason: 'Database with no replicas (SPOF)',
        recommendation: 'Increase replicationFactor to ≥ 2 and add read replicas for read-heavy workloads.',
        severity: 'warning',
      })
    }
  }

  return spofNodes
}

function severityRank(s: string): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1
}

export function StatusBar() {
  const store = useDiagramStore()
  const { systemMetrics, simState, nodes, edges } = store

  // Compute bottlenecks for status bar
  const bottlenecks: any[] = []
  for (const node of nodes) {
    const result = getBottleneckReason(node)
    if (result) {
      bottlenecks.push({ label: node.data.label, ...result })
    }
  }
  const spofs = getSPOFBottlenecks(nodes, edges)
  bottlenecks.push(...spofs)

  // Deduplicate by label, keeping highest severity
  const seen = new Map<string, any>()
  for (const b of bottlenecks) {
    const existing = seen.get(b.label)
    if (!existing || severityRank(b.severity) > severityRank(existing.severity)) {
      seen.set(b.label, b)
    }
  }

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
        <span className={`font-mono ${Array.from(seen.values()).length > 0 ? 'text-warning' : 'text-text'}`}>
          {Array.from(seen.values()).length}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-text-dim">Chaos</span>
        <span className={`font-mono ${store.activeChaos.length > 0 ? 'text-error' : 'text-text'}`}>
          {store.activeChaos.length}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <a
          href="https://github.com/raghukr80/syssim"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-dim hover:text-accent transition-colors text-[10px]"
        >
          Idea &amp; Design by raghukr80
        </a>
      </div>

      <span className="text-text-dim">
        {store.nodes.length} nodes · {store.edges.length} edges
      </span>
    </div>
  )
}
