import { useMemo } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts'
import { X, AlertTriangle, ArrowRight } from 'lucide-react'

interface BottleneckInfo {
  label: string
  utilization: number
  rps: number
  p99: number
  errorRate: number
  status: string
  reason: string
  recommendation: string
  severity: 'critical' | 'warning' | 'info'
}

function getBottleneckReason(node: any): { reason: string; rec: string; severity: 'critical' | 'warning' | 'info' } | null {
  const m = node.data.metrics
  const config = node.data.config
  if (!m) return null

  // Priority order: critical first
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

function getSPOFBottlenecks(nodes: any[], edges: any[]): BottleneckInfo[] {
  const spofNodes: BottleneckInfo[] = []
  // Find components with no downstream (leaf nodes that could be SPOF)
  // or components that are the sole path for multiple upstream nodes
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

    // Single instance with no autoscale and is a compute/service type
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

    // Database with replicationFactor 1
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

export function MetricsPanel() {
  const store = useDiagramStore()
  const { systemMetrics } = store

  const latencyData = systemMetrics.latencyHistory.map((s, i) => ({
    index: i,
    p50: s.p50,
    p95: s.p95,
    p99: s.p99,
  }))

  // Multi-signal bottleneck detection
  const bottlenecks = useMemo(() => {
    const detected: BottleneckInfo[] = []

    for (const node of store.nodes) {
      const result = getBottleneckReason(node)
      if (result) {
        const m = node.data.metrics
        detected.push({
          label: node.data.label,
          utilization: m?.utilization || 0,
          rps: m?.currentRps || 0,
          p99: m?.p99Latency || 0,
          errorRate: m?.errorRate || 0,
          status: node.data.status || 'idle',
          reason: result.reason,
          recommendation: result.rec,
          severity: result.severity,
        })
      }
    }

    // Add SPOF bottlenecks
    const spofs = getSPOFBottlenecks(store.nodes, store.edges)
    detected.push(...spofs)

    // Deduplicate by label, keeping highest severity
    const seen = new Map<string, BottleneckInfo>()
    for (const b of detected) {
      const existing = seen.get(b.label)
      if (!existing || severityRank(b.severity) > severityRank(existing.severity)) {
        seen.set(b.label, b)
      }
    }

    return Array.from(seen.values())
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.utilization - a.utilization)
      .slice(0, 10)
  }, [store.nodes, store.edges])

  return (
    <div className="absolute inset-0 z-50 bg-bg flex flex-col overflow-hidden">
      <div className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <h2 className="text-lg font-bold text-text">System Metrics Analysis</h2>
        <button onClick={() => store.toggleMetrics()} className="p-2 rounded hover:bg-surface-hover text-text-dim hover:text-text">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Total RPS" value={systemMetrics.totalRps.toLocaleString()} color="accent" />
          <MetricCard label="System P99" value={`${systemMetrics.systemP99.toFixed(0)}ms`} color={systemMetrics.systemP99 > 500 ? 'error' : systemMetrics.systemP99 > 200 ? 'warning' : 'success'} />
          <MetricCard label="Error Rate" value={`${(systemMetrics.errorRate * 100).toFixed(2)}%`} color={systemMetrics.errorRate > 0.05 ? 'error' : 'success'} />
          <MetricCard label="Bottlenecks" value={bottlenecks.length.toString()} color={bottlenecks.length > 0 ? 'warning' : 'text'} />
        </div>

        {/* Latency chart */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Latency Distribution</h3>
          <div className="h-64">
            {latencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <XAxis dataKey="index" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-dim)', fontSize: 10 }} />
                  <YAxis stroke="var(--color-border)" tick={{ fill: 'var(--color-text-dim)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--color-text-dim)' }}
                  />
                  <Area type="monotone" dataKey="p50" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.1} strokeWidth={2} name="P50" />
                  <Area type="monotone" dataKey="p95" stroke="var(--color-warning)" fill="var(--color-warning)" fillOpacity={0.1} strokeWidth={2} name="P95" />
                  <Area type="monotone" dataKey="p99" stroke="var(--color-error)" fill="var(--color-error)" fillOpacity={0.1} strokeWidth={2} name="P99" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-dim text-sm">No data yet — run a simulation</div>
            )}
          </div>
        </div>

        {/* Bottleneck analysis with recommendations */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            Bottleneck Analysis & Recommendations
          </h3>
          {bottlenecks.length > 0 ? (
            <div className="space-y-3">
              {bottlenecks.map((b, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  b.severity === 'critical' ? 'border-error/30 bg-error/5' :
                  b.severity === 'warning' ? 'border-warning/30 bg-warning/5' :
                  'border-border bg-bg/30'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          b.severity === 'critical' ? 'bg-error' : b.severity === 'warning' ? 'bg-warning' : 'bg-accent'
                        }`} />
                        <span className="text-xs font-semibold text-text truncate">{b.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          b.severity === 'critical' ? 'bg-error/20 text-error' :
                          b.severity === 'warning' ? 'bg-warning/20 text-warning' :
                          'bg-accent/20 text-accent'
                        }`}>{b.severity}</span>
                      </div>
                      <p className="text-[10px] text-text-dim mb-1.5">{b.reason}</p>
                      <div className="flex items-center gap-1 text-[10px] text-text-dim">
                        <ArrowRight className="w-3 h-3 shrink-0 text-success" />
                        <span className="text-success">{b.recommendation}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-[10px] space-y-0.5">
                      <div className="text-text-dim">Util: <span className={`font-mono ${b.utilization > 0.8 ? 'text-error' : 'text-text'}`}>{(b.utilization * 100).toFixed(0)}%</span></div>
                      <div className="text-text-dim">RPS: <span className="font-mono text-text">{b.rps.toLocaleString()}</span></div>
                      <div className="text-text-dim">P99: <span className="font-mono text-text">{b.p99.toFixed(0)}ms</span></div>
                      {b.errorRate > 0.01 && <div className="text-text-dim">Err: <span className="font-mono text-error">{(b.errorRate * 100).toFixed(1)}%</span></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-dim text-sm">No bottlenecks detected — system operating normally</p>
          )}
        </div>
      </div>
    </div>
  )
}

function severityRank(s: string): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    text: 'text-text',
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="text-xs text-text-dim mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${colorMap[color] || 'text-text'}`}>{value}</div>
    </div>
  )
}
