import { useDiagramStore } from '../../stores/diagramStore'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts'
import { X } from 'lucide-react'

export function MetricsPanel() {
  const store = useDiagramStore()
  const { systemMetrics } = store

  const latencyData = systemMetrics.latencyHistory.map((s, i) => ({
    index: i,
    p50: s.p50,
    p95: s.p95,
    p99: s.p99,
  }))

  // Get top bottlenecks
  const bottlenecks = Object.entries(store.nodes.reduce((acc: any, node) => {
    const m = node.data.metrics
    if (m && m.utilization > 0.6) {
      acc[node.id] = { label: node.data.label, utilization: m.utilization, rps: m.currentRps, p99: m.p99Latency }
    }
    return acc
  }, {})).sort(([, a]: any, [, b]: any) => b.utilization - a.utilization).slice(0, 5)

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
          <MetricCard label="Bottlenecks" value={systemMetrics.bottleneckCount.toString()} color={systemMetrics.bottleneckCount > 0 ? 'warning' : 'text'} />
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

        {/* Bottleneck table */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Bottleneck Analysis</h3>
          {bottlenecks.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-dim text-xs border-b border-border">
                  <th className="text-left py-2 font-medium">Component</th>
                  <th className="text-right py-2 font-medium">Utilization</th>
                  <th className="text-right py-2 font-medium">RPS</th>
                  <th className="text-right py-2 font-medium">P99</th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.map(([id, data]: [string, any]) => (
                  <tr key={id} className="border-b border-border/50">
                    <td className="py-2 text-text">{data.label}</td>
                    <td className={`py-2 text-right font-mono ${data.utilization > 0.9 ? 'text-error' : 'text-warning'}`}>
                      {(data.utilization * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 text-right font-mono text-text">{data.rps.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono text-text">{data.p99.toFixed(0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-text-dim text-sm">No bottlenecks detected</p>
          )}
        </div>
      </div>
    </div>
  )
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
