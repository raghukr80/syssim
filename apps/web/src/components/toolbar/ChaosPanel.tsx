import { useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { Zap, X, Clock, AlertTriangle, ChevronRight, Check } from 'lucide-react'
import type { ChaosScenario, ChaosCategory, ComponentType } from '../../types'

// ─── Chaos Scenario Definitions ──────────────────────────────────
interface ChaosDefinition extends Omit<ChaosScenario, 'id'> {
  id: string
  icon: string
}

const CHAOS_SCENARIOS: ChaosDefinition[] = [
  // Network
  { id: 'latency-spike', name: 'Latency Spike', category: 'network', icon: '📡', description: 'Inject 200ms additional latency with 50ms jitter', targetTypes: ['load_balancer', 'api_gateway', 'web_server', 'serverless', 'container_cluster', 'database', 'cache', 'third_party_api', 'cdn', 'dns'], latencyInjection: { delayMs: 200, jitterMs: 50 } },
  { id: 'packet-loss', name: 'Packet Loss', category: 'network', icon: '📉', description: '10% packet loss causing retransmissions and timeouts', targetTypes: ['load_balancer', 'api_gateway', 'web_server', 'serverless', 'container_cluster', 'database', 'cache', 'third_party_api'], failureRate: 0.10 },
  { id: 'bandwidth-limit', name: 'Bandwidth Limit', category: 'network', icon: '🚦', description: 'Throttle bandwidth to 10 Mbps', targetTypes: ['load_balancer', 'cdn', 'storage', 'message_queue', 'event_bus'], bandwidthLimitMbps: 10 },
  { id: 'dns-failure', name: 'DNS Failure', category: 'network', icon: '🔌', description: 'DNS resolution fails 50% of the time', targetTypes: ['dns'], failureRate: 0.5 },

  // Infrastructure
  { id: 'instance-failure', name: 'Instance Failure', category: 'infrastructure', icon: '💀', description: 'Kill all requests — 100% failure rate', targetTypes: ['web_server', 'serverless', 'container_cluster', 'load_balancer', 'api_gateway'], failureRate: 1.0 },
  { id: 'cpu-spike', name: 'CPU Saturation', category: 'infrastructure', icon: '🔥', description: 'CPU spike causes 5x latency increase', targetTypes: ['web_server', 'container_cluster', 'database', 'serverless'], cpuSpike: 5 },
  { id: 'memory-pressure', name: 'Memory Pressure', category: 'infrastructure', icon: '🧠', description: 'Memory exhaustion triggers OOM and degraded performance', targetTypes: ['web_server', 'container_cluster', 'database', 'cache'], memoryPressure: 0.9 },
  { id: 'disk-full', name: 'Disk Full', category: 'infrastructure', icon: '💾', description: 'Storage full — writes fail, reads slow', targetTypes: ['database', 'storage'], failureRate: 0.3 },

  // Traffic
  { id: 'traffic-surge', name: 'Traffic Surge', category: 'traffic', icon: '🌊', description: '10x normal traffic spike', targetTypes: ['load_balancer', 'api_gateway', 'web_server', 'serverless', 'container_cluster'] },
  { id: 'thundering-herd', name: 'Thundering Herd', category: 'traffic', icon: '🦬', description: 'Simultaneous cache expiry causes DB overload', targetTypes: ['cache', 'database'] },
  { id: 'connection-exhaustion', name: 'Connection Pool Exhaustion', category: 'traffic', icon: '🔗', description: 'All connections consumed, new requests queued', targetTypes: ['database', 'web_server', 'container_cluster', 'third_party_api'], failureRate: 0.15 },

  // Data
  { id: 'data-corruption', name: 'Data Corruption', category: 'data', icon: '☢️', description: '5% of reads return corrupted data', targetTypes: ['database', 'cache', 'storage'], failureRate: 0.05 },
  { id: 'replication-lag', name: 'Replication Lag', category: 'data', icon: '⏱️', description: 'Replica lags 5s behind primary — stale reads', targetTypes: ['database'], latencyInjection: { delayMs: 5000, jitterMs: 1000 } },
  { id: 'cache-poisoning', name: 'Cache Poisoning', category: 'data', icon: '☠️', description: 'Invalid data injected into cache — all hits return bad data', targetTypes: ['cache'], failureRate: 0.3 },

  // Application
  { id: 'deployment-bug', name: 'Bad Deployment', category: 'application', icon: '🐛', description: 'New deploy causes 5xx errors on 20% of requests', targetTypes: ['web_server', 'serverless', 'container_cluster', 'api_gateway'], failureRate: 0.2 },
  { id: 'config-error', name: 'Config Misconfiguration', category: 'application', icon: '⚙️', description: 'Wrong config causes all requests to fail', targetTypes: ['web_server', 'serverless', 'container_cluster', 'load_balancer', 'api_gateway'], failureRate: 1.0 },
  { id: 'memory-leak', name: 'Memory Leak', category: 'application', icon: '💧', description: 'Gradual memory leak degrades performance over time', targetTypes: ['web_server', 'container_cluster', 'database', 'cache', 'serverless'], memoryPressure: 0.7 },

  // Dependencies
  { id: 'third-party-down', name: 'Third-Party Down', category: 'dependency', icon: '🔴', description: 'External API completely unreachable', targetTypes: ['third_party_api'], failureRate: 1.0 },
  { id: 'third-party-slow', name: 'Third-Party Degraded', category: 'dependency', icon: '🐌', description: 'External API responds with 1s+ latency', targetTypes: ['third_party_api'], latencyInjection: { delayMs: 1000, jitterMs: 500 } },
  { id: 'certificate-expired', name: 'Certificate Expired', category: 'dependency', icon: '📜', description: 'TLS certificate expired — all HTTPS connections fail', targetTypes: ['load_balancer', 'api_gateway', 'cdn', 'waf'], failureRate: 0.5 },
]

const CATEGORY_LABELS: Record<ChaosCategory, string> = {
  network: 'Network',
  infrastructure: 'Infrastructure',
  traffic: 'Traffic',
  data: 'Data',
  application: 'Application',
  dependency: 'Dependencies',
}

const CATEGORY_COLORS: Record<ChaosCategory, string> = {
  network: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  infrastructure: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  traffic: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  data: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  application: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  dependency: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export function ChaosPanel() {
  const store = useDiagramStore()
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ChaosCategory | 'all'>('all')
  const [injectingId, setInjectingId] = useState<string | null>(null)
  const [targetSelector, setTargetSelector] = useState<{ scenario: ChaosDefinition; compatible: any[] } | null>(null)

  const categories = Array.from(new Set(CHAOS_SCENARIOS.map(s => s.category)))
  const filtered = selectedCategory === 'all' ? CHAOS_SCENARIOS : CHAOS_SCENARIOS.filter(s => s.category === selectedCategory)

  const getCompatibleNodes = (scenario: ChaosDefinition) => {
    return store.nodes.filter(n => scenario.targetTypes.includes(n.data.componentType))
  }

  const handleInjectClick = (scenario: ChaosDefinition) => {
    const compatible = getCompatibleNodes(scenario)
    console.log('[Chaos] handleInjectClick', scenario.name, 'compatible:', compatible.length)
    if (compatible.length === 0) return
    if (compatible.length === 1) {
      store.injectChaos({ ...scenario } as ChaosScenario, compatible[0].id)
      setInjectingId(scenario.id)
      setTimeout(() => setInjectingId(null), 1000)
    } else {
      // Initialize selection state and show selector
      compatible.forEach((n: any) => { n._selected = true })
      setTargetSelector({ scenario, compatible: [...compatible] })
    }
  }

  const handleTargetInject = (scenario: ChaosDefinition, targetIds: string[]) => {
    targetIds.forEach(id => {
      store.injectChaos({ ...scenario } as ChaosScenario, id)
    })
    setTargetSelector(null)
    setInjectingId(scenario.id)
    setTimeout(() => setInjectingId(null), 1000)
  }

  const activeCount = store.activeChaos.length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors relative ${
          activeCount > 0
            ? 'bg-error/20 text-error hover:bg-error/30'
            : 'hover:bg-surface-hover text-text-dim hover:text-text'
        }`}
        title="Chaos Engineering"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Chaos</span>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-error text-white text-[8px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Main Chaos Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { if (!targetSelector) setOpen(false) }}>
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl w-[720px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                  <Zap className="w-4 h-4 text-error" />
                  Chaos Engineering
                </h2>
                <p className="text-xs text-text-dim mt-0.5">Inject failures to test system resilience</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Active chaos events */}
            {store.activeChaos.length > 0 && (
              <div className="px-5 py-3 border-b border-border bg-error/5 shrink-0">
                <div className="text-[10px] font-semibold text-error uppercase tracking-widest mb-2">Active Chaos ({store.activeChaos.length})</div>
                <div className="flex flex-wrap gap-2">
                  {store.activeChaos.map((ac, i) => {
                    const node = store.nodes.find(n => n.id === ac.targetNodeId)
                    return (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-error/10 border border-error/20 text-xs">
                        <AlertTriangle className="w-3 h-3 text-error" />
                        <span className="text-text">{ac.scenario.name}</span>
                        <span className="text-text-dim">→</span>
                        <span className="text-text-dim">{node?.data.label || ac.targetNodeId}</span>
                        <button
                          onClick={() => store.removeChaos(ac.scenario.id)}
                          className="ml-1 p-0.5 rounded hover:bg-error/20 text-error"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => store.clearAllChaos()}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-surface-hover border border-border text-[10px] text-text-dim hover:text-error hover:border-error/30 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Category filter */}
            <div className="px-5 py-3 border-b border-border shrink-0">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                    selectedCategory === 'all' ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors border ${
                      selectedCategory === cat ? CATEGORY_COLORS[cat] : 'text-text-dim hover:text-text hover:bg-surface-hover border-transparent'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filtered.map((scenario) => {
                const compatible = getCompatibleNodes(scenario)
                const isActive = store.activeChaos.some(ac => ac.scenario.id === scenario.id)
                const isInjecting = injectingId === scenario.id

                return (
                  <div
                    key={scenario.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'border-error/40 bg-error/5'
                        : 'border-border hover:border-accent/30 bg-bg/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{scenario.icon}</span>
                          <span className="text-xs font-medium text-text">{scenario.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-error/20 text-error uppercase tracking-wider">Active</span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-dim leading-relaxed">{scenario.description}</p>
                        <div className="text-[9px] text-text-dim mt-1">
                          {compatible.length} compatible node{compatible.length !== 1 ? 's' : ''} on canvas
                        </div>
                      </div>
                      <button
                        onClick={() => handleInjectClick(scenario)}
                        disabled={compatible.length === 0 || isInjecting}
                        className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-semibold transition-all ${
                          isInjecting
                            ? 'bg-error/30 text-error animate-pulse'
                            : compatible.length === 0
                            ? 'bg-bg text-text-dim cursor-not-allowed'
                            : isActive
                            ? 'bg-error/20 text-error hover:bg-error/30 border border-error/30'
                            : 'bg-error/10 text-error hover:bg-error/20 border border-error/20'
                        }`}
                      >
                        {isInjecting ? (
                          <><Clock className="w-3 h-3 animate-spin" /> Injecting...</>
                        ) : compatible.length === 1 ? (
                          <><Zap className="w-3 h-3" /> Inject</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Select Targets</>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Target Selection Modal */}
      {targetSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTargetSelector(null)}>
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl w-[500px] max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <h3 className="text-xs font-semibold text-text flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-error" />
                  {targetSelector.scenario.name}
                </h3>
                <p className="text-[10px] text-text-dim mt-0.5">Select target nodes to inject chaos</p>
              </div>
              <button onClick={() => setTargetSelector(null)} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select all / none */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
              <button
                onClick={() => {
                  const allSelected = targetSelector.compatible.every(n => (n as any)._selected)
                  targetSelector.compatible.forEach(n => (n as any)._selected = !allSelected)
                  setTargetSelector({ ...targetSelector, compatible: [...targetSelector.compatible] })
                }}
                className="text-[10px] text-accent hover:text-accent/80 transition-colors"
              >
                {targetSelector.compatible.every(n => (n as any)._selected) ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-[10px] text-text-dim">
                {targetSelector.compatible.filter(n => (n as any)._selected).length} / {targetSelector.compatible.length} selected
              </span>
            </div>

            {/* Node list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {targetSelector.compatible.map((node: any) => {
                const isSelected = node._selected
                return (
                  <div
                    key={node.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent/40 bg-accent/10'
                        : 'border-border hover:border-accent/20 bg-bg/30'
                    }`}
                    onClick={() => {
                      node._selected = !isSelected
                      setTargetSelector({ ...targetSelector, compatible: [...targetSelector.compatible] })
                    }}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-accent border-accent' : 'border-border'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm">{node.data.icon || '⚙️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text truncate">{node.data.label}</div>
                      <div className="text-[9px] text-text-dim">{node.data.componentType.replace(/_/g, ' ')}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Inject button */}
            <div className="px-4 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-text-dim">
                {targetSelector.compatible.filter(n => (n as any)._selected).length} node(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetSelector(null)}
                  className="px-3 py-1.5 rounded text-[10px] font-medium text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const selectedIds = targetSelector.compatible.filter(n => (n as any)._selected).map(n => n.id)
                    if (selectedIds.length > 0) {
                      handleTargetInject(targetSelector.scenario, selectedIds)
                    }
                  }}
                  disabled={targetSelector.compatible.filter(n => (n as any)._selected).length === 0}
                  className={`flex items-center gap-1 px-4 py-1.5 rounded text-[10px] font-semibold transition-all ${
                    targetSelector.compatible.filter(n => (n as any)._selected).length === 0
                      ? 'bg-bg text-text-dim cursor-not-allowed'
                      : 'bg-error/10 text-error hover:bg-error/20 border border-error/20'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Inject Chaos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
