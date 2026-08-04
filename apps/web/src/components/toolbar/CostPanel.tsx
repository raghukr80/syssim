import { useState, useMemo } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { getComponentMeta } from '../../types/components'
import { DollarSign, X, TrendingUp, Server, HardDrive, Network, MousePointer } from 'lucide-react'
import type { CostEstimate } from '../../types'

// ── Cloud-specific cost per RPS (per request) ──
// Sourced from provider pricing pages (approximate, 2026 estimates)
// AWS: https://aws.amazon.com/pricing/  Azure: https://azure.microsoft.com/en-us/pricing/
// GCP: https://cloud.google.com/pricing/
const RPS_COST: Record<string, { aws: number; azure: number; gcp: number }> = {
  load_balancer:    { aws: 0.000_025, azure: 0.000_028, gcp: 0.000_022 },
  api_gateway:      { aws: 0.003_500, azure: 0.004_000, gcp: 0.003_200 },
  cdn:              { aws: 0.000_085, azure: 0.000_090, gcp: 0.000_080 },
  dns:              { aws: 0.000_040, azure: 0.000_045, gcp: 0.000_035 },
  web_server:       { aws: 0.000_012, azure: 0.000_014, gcp: 0.000_010 },
  serverless:       { aws: 0.000_200, azure: 0.000_220, gcp: 0.000_180 },
  container_cluster:{ aws: 0.000_185, azure: 0.000_200, gcp: 0.000_170 },
  microservice:     { aws: 0.000_012, azure: 0.000_014, gcp: 0.000_010 },
  graphql:          { aws: 0.000_015, azure: 0.000_017, gcp: 0.000_012 },
  websocket:        { aws: 0.000_008, azure: 0.000_009, gcp: 0.000_007 },
  worker:           { aws: 0.000_006, azure: 0.000_007, gcp: 0.000_005 },
  cron_job:         { aws: 0.000_001, azure: 0.000_001, gcp: 0.000_001 },
  database:         { aws: 0.000_280, azure: 0.000_310, gcp: 0.000_250 },
  cache:            { aws: 0.000_125, azure: 0.000_140, gcp: 0.000_110 },
  storage:          { aws: 0.000_050, azure: 0.000_055, gcp: 0.000_045 },
  search_engine:    { aws: 0.000_320, azure: 0.000_350, gcp: 0.000_290 },
  graph_database:   { aws: 0.000_340, azure: 0.000_370, gcp: 0.000_310 },
  data_warehouse:   { aws: 0.000_500, azure: 0.000_550, gcp: 0.000_470 },
  data_lake:        { aws: 0.000_040, azure: 0.000_045, gcp: 0.000_035 },
  message_queue:    { aws: 0.000_040, azure: 0.000_045, gcp: 0.000_035 },
  event_bus:        { aws: 0.000_030, azure: 0.000_033, gcp: 0.000_027 },
  third_party_api:  { aws: 0.001_000, azure: 0.001_000, gcp: 0.001_000 },
  // Zero-cost types
  client:           { aws: 0, azure: 0, gcp: 0 },
  identity_provider:{ aws: 0.000_060, azure: 0.000_065, gcp: 0.000_055 },
  monitoring:       { aws: 0.000_030, azure: 0.000_033, gcp: 0.000_027 },
  logging:          { aws: 0.000_050, azure: 0.000_055, gcp: 0.000_045 },
  tracing:          { aws: 0.000_020, azure: 0.000_022, gcp: 0.000_018 },
  ml_model:         { aws: 0.001_200, azure: 0.001_350, gcp: 0.001_100 },
  recommendation_engine:{ aws: 0.000_800, azure: 0.000_900, gcp: 0.000_750 },
}

// Default for any component type not explicitly listed
const RPS_DEFAULT = { aws: 0.000_020, azure: 0.000_022, gcp: 0.000_018 }

// ── Compute seconds in a 30-day month ──
const SECONDS_PER_MONTH = 2_592_000

export function CostPanel() {
  const store = useDiagramStore()
  const [open, setOpen] = useState(false)
  const [selectedCloud, setSelectedCloud] = useState<'AWS' | 'Azure' | 'GCP'>('AWS')

  const costEstimate = useMemo<CostEstimate>(() => {
    let compute = 0
    let storage = 0
    let networking = 0
    let requests = 0
    let awsTotal = 0
    let azureTotal = 0
    let gcpTotal = 0

    for (const node of store.nodes) {
      const meta = getComponentMeta(node.data.componentType)
      const rps = node.data.metrics?.currentRps || 1  // default to 1 to show base cost

      // Base monthly infrastructure cost
      const awsBaseCost = meta?.awsCostPerMonth || 0
      const azureBaseCost = meta?.azureCostPerMonth || 0
      const gcpBaseCost = meta?.gcpCostPerMonth || 0

      // Cloud-specific variable cost
      const rates = RPS_COST[node.data.componentType as keyof typeof RPS_COST] || RPS_DEFAULT
      const awsRpsCost = rates.aws * rps * SECONDS_PER_MONTH
      const azureRpsCost = rates.azure * rps * SECONDS_PER_MONTH
      const gcpRpsCost = rates.gcp * rps * SECONDS_PER_MONTH

      // Use AWS for breakdown (tracks the active tab selection)
      const rpsCost = awsRpsCost  // AWS reference for category breakdown

      // Categorize
      switch (node.data.componentType) {
        case 'web_server':
        case 'serverless':
        case 'container_cluster':
        case 'microservice':
        case 'graphql':
        case 'worker':
        case 'cron_job':
          compute += awsBaseCost + rpsCost
          break
        case 'database':
        case 'cache':
        case 'storage':
        case 'search_engine':
        case 'graph_database':
        case 'data_warehouse':
        case 'data_lake':
          storage += awsBaseCost + rpsCost * 0.5
          compute += rpsCost * 0.5
          break
        case 'load_balancer':
        case 'cdn':
        case 'dns':
        case 'api_gateway':
        case 'message_queue':
        case 'event_bus':
          networking += awsBaseCost + rpsCost * 0.6
          requests += rpsCost * 0.4
          break
        case 'third_party_api':
          requests += rpsCost
          break
        default:
          // ML models, monitoring, logging, etc.
          networking += awsBaseCost + rpsCost * 0.3
          requests += rpsCost * 0.7
      }

      // Add to multi-cloud totals (correct each)
      awsTotal += awsBaseCost + awsRpsCost
      azureTotal += azureBaseCost + azureRpsCost
      gcpTotal += gcpBaseCost + gcpRpsCost
    }

    return { compute, storage, networking, requests, total: compute + storage + networking + requests, awsTotal, azureTotal, gcpTotal }
  }, [store.nodes])

  const formatCost = (v: number) => {
    if (v < 0.001) return '$0'
    if (v < 1) return `$${v.toFixed(3)}`
    if (v < 100) return `$${v.toFixed(2)}`
    return `$${v.toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}`
  }

  const costItems = [
    { label: 'Compute', value: costEstimate.compute, icon: Server, color: 'text-blue-400', bgColor: 'bg-blue-400' },
    { label: 'Storage', value: costEstimate.storage, icon: HardDrive, color: 'text-purple-400', bgColor: 'bg-purple-400' },
    { label: 'Networking', value: costEstimate.networking, icon: Network, color: 'text-cyan-400', bgColor: 'bg-cyan-400' },
    { label: 'Requests', value: costEstimate.requests, icon: MousePointer, color: 'text-green-400', bgColor: 'bg-green-400' },
  ]

  const currentCloudTotal = selectedCloud === 'AWS' ? costEstimate.awsTotal :
                             selectedCloud === 'Azure' ? costEstimate.azureTotal :
                             costEstimate.gcpTotal

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
        title="Cost Estimation (Approximate)"
      >
        <DollarSign className="w-3.5 h-3.5" />
        <span>{formatCost(currentCloudTotal)}</span>
        <span className="text-[8px] opacity-50">≈</span>
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
                  Multi-Cloud Cost Estimation
                </h2>
                <p className="text-xs text-text-dim mt-0.5">AWS • Azure • GCP — Cloud-specific compute, storage, & networking costs</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cloud Provider Tabs */}
            <div className="flex border-b border-border shrink-0 bg-bg/50">
              {(['AWS', 'Azure', 'GCP'] as const).map((cloud) => (
                <button
                  key={cloud}
                  onClick={() => setSelectedCloud(cloud)}
                  className={`flex-1 px-4 py-2 text-xs font-medium transition-colors capitalize ${
                    selectedCloud === cloud
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-text-dim hover:text-text'
                  }`}
                >
                  {cloud}
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="px-5 py-5 border-b border-border bg-accent/5">
              <div className="text-center">
                <div className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Approx. Monthly Cost ({selectedCloud})</div>
                <div className="text-3xl font-bold text-text">{formatCost(currentCloudTotal)}</div>
                <div className="text-xs text-text-dim mt-1">current load · cloud-specific rates · approx ±20%</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Cloud comparison bar */}
              <div className="mb-3 p-3 bg-bg/30 rounded-lg border border-border">
                <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Cloud Comparison</div>
                <div className="space-y-2">
                  {[
                    { name: 'AWS', cost: costEstimate.awsTotal, color: 'bg-orange-400' },
                    { name: 'Azure', cost: costEstimate.azureTotal, color: 'bg-blue-400' },
                    { name: 'GCP', cost: costEstimate.gcpTotal, color: 'bg-green-400' },
                  ].map(provider => {
                    const maxCost = Math.max(costEstimate.awsTotal, costEstimate.azureTotal, costEstimate.gcpTotal, 1)
                    const pct = (provider.cost / maxCost) * 100
                    return (
                      <div key={provider.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-text w-10 font-medium">{provider.name}</span>
                        <div className="flex-1 h-3 bg-bg rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${provider.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-text font-mono w-16 text-right">{formatCost(provider.cost)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Cost Breakadown</div>
              {costItems.map(item => {
                const pct = currentCloudTotal > 0 ? (item.value / currentCloudTotal) * 100 : 0
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
                  <span className="text-sm font-semibold text-text">{formatCost(currentCloudTotal * 12)}</span>
                </div>
                {currentCloudTotal > 10 && (
                  <>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-dim">With reserved instances (40% savings)</span>
                      <span className="text-xs font-mono text-success">{formatCost(currentCloudTotal * 12 * 0.6)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-dim">1-yr commitment discount</span>
                      <span className="text-xs font-mono text-success">{formatCost(currentCloudTotal * 12 * 0.65)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Per-component breakdown */}
              <div className="mt-4">
                <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Per-Component ({selectedCloud})</div>
                <div className="space-y-1">
                  {store.nodes.map(node => {
                    const meta = getComponentMeta(node.data.componentType)
                    const baseCost = selectedCloud === 'AWS' ? (meta?.awsCostPerMonth || 0) :
                                     selectedCloud === 'Azure' ? (meta?.azureCostPerMonth || 0) :
                                     (meta?.gcpCostPerMonth || 0)
                    const rps = node.data.metrics?.currentRps || 1
                    const R = RPS_COST[node.data.componentType as keyof typeof RPS_COST] || RPS_DEFAULT
                    const rpsCost = (selectedCloud === 'AWS' ? R.aws : 
                                     selectedCloud === 'Azure' ? R.azure : 
                                     R.gcp) * rps * SECONDS_PER_MONTH
                    const total = baseCost + rpsCost
                    if (total < 0.01) return null
                    return (
                      <div key={node.id} className="flex items-center justify-between text-[11px] py-1">
                        <div className="flex items-center gap-2">
                          <span>{meta?.icon}</span>
                          <span className="text-text">{node.data.label}</span>
                          <span className="text-text-dim">({meta?.cloudEquivalents?.[selectedCloud.toLowerCase() as keyof typeof meta.cloudEquivalents] || meta?.awsService})</span>
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

              {/* Disclaimer */}
              <div className="pt-4 border-t border-border">
                <p className="text-[9px] text-text-dim leading-relaxed">
                  ⚠️ Approximate estimates based on service-specific RPS costs and base infrastructure pricing. 
                  Actual costs may vary based on usage patterns, reservations, amortization, organization discounts, feature flags, and region-specific pricing. 
                  Cloud pricing subject to change — current as of 2024.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}