import { useState, useMemo } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { getComponentMeta } from '../../types/components'
import { DollarSign, X, TrendingUp, Server, HardDrive, Network, MousePointer } from 'lucide-react'
import type { CostEstimate } from '../../types'

// AWS cost estimates per component type (simplified)
const COST_PER_RPS: Record<string, number> = {
  load_balancer: 0.0004,      // $/1000 requests
  api_gateway: 0.0035,         // $/request
  cdn: 0.0001,                 // $/request (after first 10TB)
  dns: 0.0001,                 // $/query
  web_server: 0.000001,        // per request (EC2 t3.medium ~$30/mo at 1000 RPS)
  serverless: 0.0000002,       // Lambda per request
  container_cluster: 0.0000015, // ECS/Fargate
  database: 0.000002,          // RDS per query
  cache: 0.0000005,            // ElastiCache per request
  storage: 0.0000004,          // S3 per request
  message_queue: 0.0000004,    // Kafka/MSK per message
  event_bus: 0.000001,         // EventBridge per event
  third_party_api: 0.001,      // External API (assumed)
  client: 0,
}

export function CostPanel() {
  const store = useDiagramStore()
  const [open, setOpen] = useState(false)

  const costEstimate = useMemo<CostEstimate>(() => {
    let compute = 0
    let storage = 0
    let networking = 0
    let requests = 0

    for (const node of store.nodes) {
      const meta = getComponentMeta(node.data.componentType)
      const rps = node.data.metrics?.currentRps || 0

      // Base monthly cost from component type
      const baseCost = meta?.awsCostPerMonth || 0

      // Variable cost from RPS
      const rpsCost = (COST_PER_RPS[node.data.componentType] || 0) * rps * 2592000 // seconds in 30-day month

      // Categorize
      switch (node.data.componentType) {
        case 'web_server':
        case 'serverless':
        case 'container_cluster':
          compute += baseCost + rpsCost
          break
        case 'database':
        case 'cache':
        case 'storage':
          storage += baseCost + rpsCost * 0.5
          compute += rpsCost * 0.5
          break
        case 'load_balancer':
        case 'cdn':
        case 'dns':
        case 'api_gateway':
          networking += baseCost + rpsCost * 0.6
          requests += rpsCost * 0.4
          break
        case 'message_queue':
        case 'event_bus':
          requests += baseCost + rpsCost
          break
        case 'third_party_api':
          requests += rpsCost
          break
      }
    }

    return { compute, storage, networking, requests, total: compute + storage + networking + requests }
  }, [store.nodes])

  const formatCost = (v: number) => {
    if (v < 1) return `$${v.toFixed(3)}`
    if (v < 100) return `$${v.toFixed(2)}`
    return `$${v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }

  const costItems = [
    { label: 'Compute', value: costEstimate.compute, icon: Server, color: 'text-blue-400', bgColor: 'bg-blue-400' },
    { label: 'Storage', value: costEstimate.storage, icon: HardDrive, color: 'text-purple-400', bgColor: 'bg-purple-400' },
    { label: 'Networking', value: costEstimate.networking, icon: Network, color: 'text-cyan-400', bgColor: 'bg-cyan-400' },
    { label: 'Requests', value: costEstimate.requests, icon: MousePointer, color: 'text-green-400', bgColor: 'bg-green-400' },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
        title="Cost Estimation"
      >
        <DollarSign className="w-3.5 h-3.5" />
        <span>{formatCost(costEstimate.total)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  AWS Cost Estimation
                </h2>
                <p className="text-xs text-text-dim mt-0.5">Based on current RPS and component types</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total */}
            <div className="px-5 py-5 border-b border-border bg-accent/5">
              <div className="text-center">
                <div className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Estimated Monthly Cost</div>
                <div className="text-3xl font-bold text-text">{formatCost(costEstimate.total)}</div>
                <div className="text-xs text-text-dim mt-1">per month at current simulation load</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Cost Breakdown</div>

              {costItems.map(item => {
                const pct = costEstimate.total > 0 ? (item.value / costEstimate.total) * 100 : 0
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        <span className="text-text">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text font-mono">{formatCost(item.value)}</span>
                        <span className="text-text-dim w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.bgColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {/* Annual projection */}
              <div className="mt-4 p-3 rounded-lg border border-border bg-bg/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text">Annual projection</span>
                  <span className="text-sm font-semibold text-text">{formatCost(costEstimate.total * 12)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-text-dim">With reserved instances (40% savings)</span>
                  <span className="text-xs font-mono text-success">{formatCost(costEstimate.total * 12 * 0.6)}</span>
                </div>
              </div>

              {/* Per-component breakdown */}
              <div className="mt-4">
                <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Per-Component</div>
                <div className="space-y-1">
                  {store.nodes.map(node => {
                    const meta = getComponentMeta(node.data.componentType)
                    const baseCost = meta?.awsCostPerMonth || 0
                    const rpsCost = (COST_PER_RPS[node.data.componentType] || 0) * (node.data.metrics?.currentRps || 0) * 2592000
                    const total = baseCost + rpsCost
                    if (total < 0.01) return null
                    return (
                      <div key={node.id} className="flex items-center justify-between text-[11px] py-1">
                        <div className="flex items-center gap-2">
                          <span>{meta?.icon}</span>
                          <span className="text-text">{node.data.label}</span>
                          <span className="text-text-dim">({meta?.awsService})</span>
                        </div>
                        <span className="text-text font-mono">{formatCost(total)}</span>
                      </div>
                    )
                  })}
                  {store.nodes.length === 0 && (
                    <div className="text-xs text-text-dim text-center py-4">Add components to see cost breakdown</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
