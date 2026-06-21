import { useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { COMPONENT_META, CATEGORIES } from '../../types/components'
import type { ComponentCategory, ChaosScenario, ChaosCategory, ComponentType } from '../../types'
import { Package, Zap, X, AlertTriangle } from 'lucide-react'

// ─── Chaos Scenario Definitions ──────────────────────────────────
interface ChaosDefinition extends Omit<ChaosScenario, 'id'> {
  id: string
  icon: string
}

const CHAOS_SCENARIOS: ChaosDefinition[] = [
  // Network
  { id: 'latency-spike', name: 'Latency Spike', category: 'network', icon: '📡', description: 'Inject 200ms additional latency with 50ms jitter', targetTypes: ['load_balancer', 'api_gateway', 'api_management', 'web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'database', 'cache', 'search_engine', 'third_party_api', 'cdn', 'dns', 'waf', 'service_mesh', 'identity_provider', 'ml_model', 'recommendation_engine', 'custom_component'], latencyInjection: { delayMs: 200, jitterMs: 50 } },
  { id: 'packet-loss', name: 'Packet Loss', category: 'network', icon: '📉', description: '10% packet loss causing retransmissions and timeouts', targetTypes: ['load_balancer', 'api_gateway', 'api_management', 'web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'database', 'cache', 'search_engine', 'third_party_api', 'service_mesh', 'identity_provider', 'custom_component'], failureRate: 0.10 },
  { id: 'bandwidth-limit', name: 'Bandwidth Limit', category: 'network', icon: '🚦', description: 'Throttle bandwidth to 10 Mbps', targetTypes: ['load_balancer', 'cdn', 'storage', 'data_lake', 'message_queue', 'event_bus', 'notification_service', 'email_service', 'sms_service', 'custom_component'], bandwidthLimitMbps: 10 },
  { id: 'dns-failure', name: 'DNS Failure', category: 'network', icon: '🔌', description: 'DNS resolution fails 50% of the time', targetTypes: ['dns'], failureRate: 0.5 },

  // Infrastructure
  { id: 'instance-failure', name: 'Instance Failure', category: 'infrastructure', icon: '💀', description: 'Kill all requests — 100% failure rate', targetTypes: ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'cron_job', 'load_balancer', 'api_gateway', 'api_management', 'service_mesh', 'ml_model', 'ml_training', 'custom_component'], failureRate: 1.0 },
  { id: 'cpu-spike', name: 'CPU Saturation', category: 'infrastructure', icon: '🔥', description: 'CPU spike causes 5x latency increase', targetTypes: ['web_server', 'microservice', 'container_cluster', 'graphql', 'websocket', 'worker', 'database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'serverless', 'ml_model', 'ml_training', 'vector_search', 'recommendation_engine', 'custom_component'], cpuSpike: 5 },
  { id: 'memory-pressure', name: 'Memory Pressure', category: 'infrastructure', icon: '🧠', description: 'Memory exhaustion triggers OOM and degraded performance', targetTypes: ['web_server', 'microservice', 'container_cluster', 'database', 'cache', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'serverless', 'ml_model', 'ml_training', 'vector_search', 'feature_store', 'custom_component'], memoryPressure: 0.9 },
  { id: 'disk-full', name: 'Disk Full', category: 'infrastructure', icon: '💾', description: 'Storage full — writes fail, reads slow', targetTypes: ['database', 'storage', 'data_lake', 'data_warehouse', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'feature_store', 'custom_component'], failureRate: 0.3 },

  // Traffic
  { id: 'traffic-surge', name: 'Traffic Surge', category: 'traffic', icon: '🌊', description: '10x normal traffic spike', targetTypes: ['load_balancer', 'api_gateway', 'api_management', 'web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'service_mesh', 'ml_model', 'recommendation_engine', 'custom_component'] },
  { id: 'thundering-herd', name: 'Thundering Herd', category: 'traffic', icon: '🦬', description: 'Simultaneous cache expiry causes DB overload', targetTypes: ['cache', 'database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'custom_component'] },
  { id: 'connection-exhaustion', name: 'Connection Pool Exhaustion', category: 'traffic', icon: '🔗', description: 'All connections consumed, new requests queued', targetTypes: ['database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'web_server', 'microservice', 'container_cluster', 'third_party_api', 'identity_provider', 'custom_component'], failureRate: 0.15 },

  // Data
  { id: 'data-corruption', name: 'Data Corruption', category: 'data', icon: '☢️', description: '5% of reads return corrupted data', targetTypes: ['database', 'cache', 'storage', 'data_lake', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'feature_store', 'custom_component'], failureRate: 0.05 },
  { id: 'replication-lag', name: 'Replication Lag', category: 'data', icon: '⏱️', description: 'Replica lags 5s behind primary — stale reads', targetTypes: ['database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'cache', 'custom_component'], latencyInjection: { delayMs: 5000, jitterMs: 1000 } },
  { id: 'cache-poisoning', name: 'Cache Poisoning', category: 'data', icon: '☠️', description: 'Invalid data injected into cache — all hits return bad data', targetTypes: ['cache', 'custom_component'], failureRate: 0.3 },

  // Application
  { id: 'deployment-bug', name: 'Bad Deployment', category: 'application', icon: '🐛', description: 'New deploy causes 5xx errors on 20% of requests', targetTypes: ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'cron_job', 'api_gateway', 'api_management', 'service_mesh', 'ml_model', 'recommendation_engine', 'custom_component'], failureRate: 0.2 },
  { id: 'config-error', name: 'Config Misconfiguration', category: 'application', icon: '⚙️', description: 'Wrong config causes all requests to fail', targetTypes: ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'load_balancer', 'api_gateway', 'api_management', 'waf', 'service_mesh', 'secrets_manager', 'identity_provider', 'monitoring', 'logging', 'tracing', 'alerting', 'custom_component'], failureRate: 1.0 },
  { id: 'memory-leak', name: 'Memory Leak', category: 'application', icon: '💧', description: 'Gradual memory leak degrades performance over time', targetTypes: ['web_server', 'microservice', 'container_cluster', 'graphql', 'websocket', 'worker', 'database', 'search_engine', 'ml_model', 'custom_component'], memoryPressure: 0.7 },

  // Dependencies
  { id: 'third-party-down', name: 'Third-Party Down', category: 'dependency', icon: '🔴', description: 'External API completely unreachable', targetTypes: ['third_party_api', 'notification_service', 'email_service', 'sms_service', 'identity_provider', 'custom_component'], failureRate: 1.0 },
  { id: 'third-party-slow', name: 'Third-Party Degraded', category: 'dependency', icon: '🐌', description: 'External API responds with 1s+ latency', targetTypes: ['third_party_api', 'notification_service', 'email_service', 'sms_service', 'identity_provider', 'custom_component'], latencyInjection: { delayMs: 1000, jitterMs: 500 } },
  { id: 'certificate-expired', name: 'Certificate Expired', category: 'dependency', icon: '📜', description: 'TLS certificate expired — all HTTPS connections fail', targetTypes: ['load_balancer', 'api_gateway', 'api_management', 'cdn', 'waf', 'certificate_manager', 'custom_component'], failureRate: 0.5 },
  { id: 'secrets-rotation', name: 'Secrets Rotation Failure', category: 'dependency', icon: '🔑', description: 'API keys rotated but app still uses old keys', targetTypes: ['secrets_manager', 'identity_provider', 'third_party_api', 'custom_component'], failureRate: 0.4 },
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

export function ComponentPalette() {
  const [activeTab, setActiveTab] = useState<'components' | 'chaos'>('components')

  return (
    <div className="w-60 bg-surface border-r border-border flex flex-col overflow-hidden shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${
            activeTab === 'components'
              ? 'text-accent border-accent bg-accent/5'
              : 'text-text-dim hover:text-text border-transparent hover:bg-surface-hover'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Components
        </button>
        <button
          onClick={() => setActiveTab('chaos')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${
            activeTab === 'chaos'
              ? 'text-error border-error bg-error/5'
              : 'text-text-dim hover:text-text border-transparent hover:bg-surface-hover'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Chaos
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'components' ? (
          <ComponentsTab />
        ) : (
          <ChaosTab />
        )}
      </div>
    </div>
  )
}

// ─── Components Tab ───────────────────────────────────────────────
function ComponentsTab() {
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('application/syssim-component', componentType)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-1">
        {CATEGORIES.map(cat => {
          const items = COMPONENT_META.filter(m => m.category === cat.key as string)
          return (
            <div key={cat.key} className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-text-dim uppercase tracking-widest">
                {cat.label}
              </div>
              {items.map(meta => (
                <div
                  key={meta.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, meta.type)}
                  className="mx-2 my-0.5 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing
                             hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-text group-hover:text-accent transition-colors truncate">
                        {meta.label}
                      </div>
                      <div className="text-[10px] text-text-dim truncate">{meta.awsService}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chaos Tab ────────────────────────────────────────────────────
function ChaosTab() {
  const store = useDiagramStore()
  const [selectedCategory, setSelectedCategory] = useState<ChaosCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [injectingId, setInjectingId] = useState<string | null>(null)

  const categories = Array.from(new Set(CHAOS_SCENARIOS.map(s => s.category)))
  const filtered = selectedCategory === 'all' ? CHAOS_SCENARIOS : CHAOS_SCENARIOS.filter(s => s.category === selectedCategory)

  const getCompatibleNodes = (scenario: ChaosDefinition) => {
    return store.nodes.filter(n => scenario.targetTypes.includes(n.data.componentType))
  }

  const handleInject = (scenario: ChaosDefinition) => {
    const compatible = getCompatibleNodes(scenario)
    if (compatible.length === 0) return
    compatible.forEach(target => {
      store.injectChaos({ ...scenario } as ChaosScenario, target.id)
    })
    setInjectingId(scenario.id)
    setTimeout(() => setInjectingId(null), 1000)
  }

  const activeCount = store.activeChaos.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Active chaos summary */}
      {activeCount > 0 && (
        <div className="px-3 py-2 border-b border-border bg-error/5 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[10px] font-semibold text-error uppercase tracking-widest">
              Active ({activeCount})
            </div>
            <button
              onClick={() => store.clearAllChaos()}
              className="text-[9px] text-text-dim hover:text-error transition-colors flex items-center gap-0.5"
            >
              <X className="w-2.5 h-2.5" /> Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {store.activeChaos.map((ac, i) => {
              const node = store.nodes.find(n => n.id === ac.targetNodeId)
              return (
                <button
                  key={i}
                  onClick={() => store.removeChaos(ac.scenario.id)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-error/10 border border-error/20 text-[9px] text-error hover:bg-error/20 transition-colors max-w-full"
                  title={`Remove ${ac.scenario.name} from ${node?.data.label || ac.targetNodeId}`}
                >
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{ac.scenario.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Category filter — horizontal scroll */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
              selectedCategory === 'all' ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface-hover'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors border ${
                selectedCategory === cat ? CATEGORY_COLORS[cat] : 'text-text-dim hover:text-text hover:bg-surface-hover border-transparent'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map((scenario) => {
          const compatible = getCompatibleNodes(scenario)
          const isActive = store.activeChaos.some(ac => ac.scenario.id === scenario.id)
          const isInjecting = injectingId === scenario.id
          const isExpanded = expandedId === scenario.id

          return (
            <div
              key={scenario.id}
              className={`rounded-lg border transition-all ${
                isActive
                  ? 'border-error/40 bg-error/5'
                  : 'border-border hover:border-error/20 bg-bg/20'
              }`}
            >
              {/* Row — always visible */}
              <div className="flex items-center gap-2 px-2.5 py-2">
                <span className="text-sm shrink-0">{scenario.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-text truncate">{scenario.name}</span>
                    {isActive && (
                      <span className="px-1 py-0 rounded text-[7px] font-bold bg-error/20 text-error uppercase">ON</span>
                    )}
                  </div>
                  <div className="text-[9px] text-text-dim">
                    {compatible.length} compatible · {scenario.targetTypes.length} types
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                    className="px-1.5 py-0.5 rounded text-[8px] text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
                  >
                    {isExpanded ? '▾' : '▸'}
                  </button>
                  <button
                    onClick={() => handleInject(scenario)}
                    disabled={compatible.length === 0 || isInjecting}
                    className={`px-2 py-1 rounded text-[9px] font-semibold transition-all ${
                      isInjecting
                        ? 'bg-error/30 text-error animate-pulse'
                        : compatible.length === 0
                        ? 'bg-bg text-text-dim cursor-not-allowed opacity-50'
                        : isActive
                        ? 'bg-error/20 text-error hover:bg-error/30 border border-error/30'
                        : 'bg-error/10 text-error hover:bg-error/20 border border-error/20'
                    }`}
                  >
                    {isInjecting ? '...' : isActive ? 'Re-apply' : 'Inject'}
                  </button>
                </div>
              </div>

              {/* Expanded description */}
              {isExpanded && (
                <div className="px-2.5 pb-2 pt-0">
                  <p className="text-[9px] text-text-dim leading-relaxed">{scenario.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {scenario.targetTypes.map(t => (
                      <span key={t} className="px-1 py-0 rounded bg-bg text-[8px] text-text-dim">
                        {t.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
