import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDiagramStore } from '../../stores/diagramStore'
import { COMPONENT_META, CATEGORIES } from '../../types/components'
import type { ComponentCategory, ChaosScenario, ChaosCategory, ComponentType } from '../../types'
import { Package, Zap, X, AlertTriangle, Check, Clock, Globe, Server, Activity, Database, Code, Link } from 'lucide-react'

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
  { id: 'connection-timeout', name: 'Connection Timeout', category: 'network', icon: '⏳', description: 'All connections timeout after 30s', targetTypes: ['load_balancer', 'api_gateway', 'database', 'cache', 'third_party_api'], failureRate: 0.4 },

  // Infrastructure
  { id: 'instance-failure', name: 'Instance Failure', category: 'infrastructure', icon: '💀', description: 'Kill all requests — 100% failure rate', targetTypes: ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'cron_job', 'load_balancer', 'api_gateway', 'api_management', 'service_mesh', 'ml_model', 'ml_training', 'custom_component'], failureRate: 1.0 },
  { id: 'cpu-spike', name: 'CPU Saturation', category: 'infrastructure', icon: '🔥', description: 'CPU spike causes 5x latency increase', targetTypes: ['web_server', 'microservice', 'container_cluster', 'graphql', 'websocket', 'worker', 'database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'serverless', 'ml_model', 'ml_training', 'vector_search', 'recommendation_engine', 'custom_component'], cpuSpike: 5 },
  { id: 'memory-pressure', name: 'Memory Pressure', category: 'infrastructure', icon: '🧠', description: 'Memory exhaustion triggers OOM and degraded performance', targetTypes: ['web_server', 'microservice', 'container_cluster', 'database', 'cache', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'serverless', 'ml_model', 'ml_training', 'vector_search', 'feature_store', 'custom_component'], memoryPressure: 0.9 },
  { id: 'disk-full', name: 'Disk Full', category: 'infrastructure', icon: '💾', description: 'Storage full — writes fail, reads slow', targetTypes: ['database', 'storage', 'data_lake', 'data_warehouse', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'feature_store', 'custom_component'], failureRate: 0.3 },
  { id: 'az-outage', name: 'AZ Outage', category: 'infrastructure', icon: '🏢', description: 'Entire availability zone goes down', targetTypes: ['web_server', 'microservice', 'container_cluster', 'database', 'cache', 'load_balancer'], failureRate: 1.0 },

  // Traffic
  { id: 'traffic-surge', name: 'Traffic Surge', category: 'traffic', icon: '🌊', description: '10x normal traffic spike', targetTypes: ['load_balancer', 'api_gateway', 'api_management', 'web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'service_mesh', 'ml_model', 'recommendation_engine', 'custom_component'] },
  { id: 'thundering-herd', name: 'Thundering Herd', category: 'traffic', icon: '🦬', description: 'Simultaneous cache expiry causes DB overload', targetTypes: ['cache', 'database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'custom_component'] },
  { id: 'ddos-attack', name: 'DDoS Attack', category: 'traffic', icon: '🚨', description: 'Volumetric DDoS saturates inbound bandwidth', targetTypes: ['load_balancer', 'api_gateway', 'waf', 'cdn'], failureRate: 0.8 },

  // Data
  { id: 'data-corruption', name: 'Data Corruption', category: 'data', icon: '☢️', description: '5% of reads return corrupted data', targetTypes: ['database', 'cache', 'storage', 'data_lake', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'feature_store', 'custom_component'], failureRate: 0.05 },
  { id: 'replication-lag', name: 'Replication Lag', category: 'data', icon: '⏱️', description: 'Replica lags 5s behind primary — stale reads', targetTypes: ['database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'cache', 'custom_component'], latencyInjection: { delayMs: 5000, jitterMs: 1000 } },
  { id: 'cache-poisoning', name: 'Cache Poisoning', category: 'data', icon: '☠️', description: 'Invalid data injected into cache — all hits return bad data', targetTypes: ['cache', 'custom_component'], failureRate: 0.3 },
  { id: 'db-deadlock', name: 'Database Deadlock', category: 'data', icon: '🔒', description: 'Deadlocks cause query timeouts and rollbacks', targetTypes: ['database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'custom_component'], failureRate: 0.25 },
  { id: 'connection-pool-exhaustion', name: 'Connection Pool Exhaustion', category: 'data', icon: '🔗', description: 'All DB connections consumed — new queries queued or rejected', targetTypes: ['database', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'web_server', 'microservice', 'container_cluster', 'third_party_api', 'identity_provider', 'custom_component'], failureRate: 0.20 },
  { id: 'data-loss', name: 'Data Loss', category: 'data', icon: '🗑️', description: 'Partial data loss — recent writes unrecoverable', targetTypes: ['database', 'storage', 'data_lake', 'data_warehouse', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'feature_store', 'custom_component'], failureRate: 0.1 },

  // Application
  { id: 'deployment-bug', name: 'Bad Deployment', category: 'application', icon: '🐛', description: 'New deploy causes 5xx errors on 20% of requests', targetTypes: ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'cron_job', 'api_gateway', 'api_management', 'service_mesh', 'ml_model', 'recommendation_engine', 'custom_component'], failureRate: 0.2 },
  { id: 'config-error', name: 'Config Misconfiguration', category: 'application', icon: '⚙️', description: 'Wrong config causes all requests to fail', targetTypes: ['web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'load_balancer', 'api_gateway', 'api_management', 'waf', 'service_mesh', 'secrets_manager', 'identity_provider', 'monitoring', 'logging', 'tracing', 'alerting', 'custom_component'], failureRate: 1.0 },
  { id: 'memory-leak', name: 'Memory Leak', category: 'application', icon: '💧', description: 'Gradual memory leak degrades performance over time', targetTypes: ['web_server', 'microservice', 'container_cluster', 'graphql', 'websocket', 'worker', 'database', 'search_engine', 'ml_model', 'custom_component'], memoryPressure: 0.7 },
  { id: 'api-rate-limit', name: 'API Rate Limit Hit', category: 'application', icon: '🚫', description: 'API rate limiting returns 429 errors', targetTypes: ['api_gateway', 'load_balancer', 'web_server', 'serverless'], failureRate: 0.5 },
  { id: 'thread-pool-exhaustion', name: 'Thread Pool Exhaustion', category: 'application', icon: '🧵', description: 'All worker threads busy — requests stall or timeout', targetTypes: ['web_server', 'microservice', 'container_cluster', 'graphql', 'websocket', 'worker', 'load_balancer', 'api_gateway', 'api_management', 'service_mesh', 'ml_model', 'recommendation_engine', 'custom_component'], failureRate: 0.35 },
  { id: 'cascading-failure', name: 'Cascading Failure', category: 'application', icon: '💥', description: 'One service failure triggers downstream outages', targetTypes: ['web_server', 'microservice', 'container_cluster', 'graphql', 'websocket', 'worker', 'load_balancer', 'api_gateway', 'api_management', 'service_mesh', 'database', 'cache', 'search_engine', 'message_queue', 'event_bus', 'notification_service', 'email_service', 'sms_service', 'third_party_api', 'identity_provider', 'ml_model', 'ml_training', 'vector_search', 'recommendation_engine', 'custom_component'], failureRate: 0.6 },

  // Dependency
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

const CATEGORY_CONFIG: Record<ChaosCategory, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  network: {
    label: 'Network',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    description: 'Latency, packet loss, bandwidth, DNS failures',
  },
  infrastructure: {
    label: 'Infrastructure',
    icon: <Server className="w-3.5 h-3.5" />,
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    description: 'Instance failures, CPU, memory, disk, AZ outages',
  },
  traffic: {
    label: 'Traffic',
    icon: <Activity className="w-3.5 h-3.5" />,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    description: 'Surges, thundering herd, connection exhaustion, DDoS',
  },
  data: {
    label: 'Data Layer',
    icon: <Database className="w-3.5 h-3.5" />,
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    description: 'Corruption, replication lag, deadlocks, connection pool, data loss',
  },
  application: {
    label: 'Application',
    icon: <Code className="w-3.5 h-3.5" />,
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    description: 'Bad deploys, config errors, memory leaks, rate limits, thread pool, cascading',
  },
  dependency: {
    label: 'Dependency',
    icon: <Link className="w-3.5 h-3.5" />,
    color: 'text-red-400 bg-red-400/10 border-red-400/30',
    description: 'Third-party outages, certificate expiry, DNS poisoning',
  },
}

export function ComponentPalette() {
  const [activeTab, setActiveTab] = useState<'components' | 'chaos'>('components')
  const [hoveredMeta, setHoveredMeta] = useState<{ meta: typeof COMPONENT_META[0]; pos: DOMRect } | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)

  const showTooltip = (meta: typeof COMPONENT_META[0], rect: DOMRect) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setHoveredMeta({ meta, pos: rect })
  }

  const scheduleHide = () => {
    hideTimeoutRef.current = window.setTimeout(() => setHoveredMeta(null), 150)
  }

  return (
    <div className="w-60 bg-surface border-r border-border flex flex-col h-full shrink-0">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'components' ? (
          <ComponentsTab onHover={showTooltip} onHoverEnd={scheduleHide} />
        ) : (
          <ChaosTab />
        )}
      </div>

      {/* Portal-based tooltip for viewport-aware positioning */}
      {hoveredMeta && createPortal(
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            left: hoveredMeta.pos.right + 8 + 288 > window.innerWidth ? undefined : hoveredMeta.pos.right + 8,
            right: hoveredMeta.pos.right + 8 + 288 > window.innerWidth ? 8 : undefined,
            top: Math.min(hoveredMeta.pos.top, window.innerHeight - 180),
          }}
        >
          <div className="bg-bg border border-border rounded-lg shadow-2xl p-3 w-72">
            <div className="text-xs font-semibold text-text mb-1">{hoveredMeta.meta.label}</div>
            <div className="text-[10px] text-text-dim mb-2">{hoveredMeta.meta.description}</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <div className="text-[9px] font-medium text-text uppercase tracking-wide">Cloud Equivalents</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                <div className="text-accent font-medium">AWS</div>
                <div className="text-text-dim">{hoveredMeta.meta.cloudEquivalents.aws}</div>
                <div className="text-blue-400 font-medium">Azure</div>
                <div className="text-text-dim">{hoveredMeta.meta.cloudEquivalents.azure}</div>
                <div className="text-orange-400 font-medium">GCP</div>
                <div className="text-text-dim">{hoveredMeta.meta.cloudEquivalents.gcp}</div>
                <div className="text-green-400 font-medium">OSS</div>
                <div className="text-text-dim">{hoveredMeta.meta.cloudEquivalents.oss}</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Components Tab ───────────────────────────────────────────────
interface ComponentsTabProps {
  onHover: (meta: typeof COMPONENT_META[0], rect: DOMRect) => void
  onHoverEnd: () => void
}

function ComponentsTab({ onHover, onHoverEnd }: ComponentsTabProps) {
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('application/syssim-component', componentType)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto overflow-x-visible py-1">
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
                  className="mx-2 my-0.5 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:bg-surface-hover transition-colors"
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    onHover(meta, rect)
                  }}
                  onMouseLeave={onHoverEnd}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-text truncate">
                        {meta.label}
                      </div>
                      <div className="text-[10px] text-text-dim truncate">{meta.description}</div>
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
  const [expandedCategory, setExpandedCategory] = useState<ChaosCategory | null>(null)
  const [injectingId, setInjectingId] = useState<string | null>(null)
  const [targetSelector, setTargetSelector] = useState<{ scenario: ChaosDefinition; compatible: any[] } | null>(null)

  const categories = Object.keys(CATEGORY_CONFIG) as ChaosCategory[]

  const getCompatibleNodes = (scenario: ChaosDefinition) => {
    return store.nodes.filter(n => scenario.targetTypes.includes(n.data.componentType))
  }

  const handleInjectClick = (scenario: ChaosDefinition) => {
    const compatible = getCompatibleNodes(scenario)
    if (compatible.length === 0) return
    if (compatible.length === 1) {
      store.injectChaos({ ...scenario } as ChaosScenario, compatible[0].id)
      setInjectingId(scenario.id)
      setTimeout(() => setInjectingId(null), 1000)
    } else {
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

  const toggleCategory = (cat: ChaosCategory) => {
    setExpandedCategory(expandedCategory === cat ? null : cat)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
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

      {/* Category sections — collapsible */}
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => {
          const config = CATEGORY_CONFIG[cat]
          const scenarios = CHAOS_SCENARIOS.filter(s => s.category === cat)
          const isExpanded = expandedCategory === cat
          const hasActive = store.activeChaos.some(ac => ac.scenario.category === cat)
          const activeCatCount = store.activeChaos.filter(ac => ac.scenario.category === cat).length

          return (
            <div key={cat} className="border-b border-border last:border-b-0">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-hover ${
                  hasActive ? 'bg-error/5' : ''
                }`}
              >
                <div className={`p-1 rounded border ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-text">{config.label}</span>
                    {hasActive && (
                      <span className="px-1 py-0 rounded text-[7px] font-bold bg-error/20 text-error uppercase">
                        {activeCatCount}
                      </span>
                    )}
                    <span className="text-[9px] text-text-dim">
                      {scenarios.length} scenarios
                    </span>
                  </div>
                  <p className="text-[9px] text-text-dim truncate">{config.description}</p>
                </div>
                <span className={`text-text-dim text-[10px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {/* Scenario list (collapsible) */}
              {isExpanded && (
                <div className="px-2 pb-2 space-y-1">
                  {scenarios.map((scenario) => {
                    const compatible = getCompatibleNodes(scenario)
                    const isActive = store.activeChaos.some(ac => ac.scenario.id === scenario.id)
                    const isInjecting = injectingId === scenario.id

                    return (
                      <div
                        key={scenario.id}
                        className={`rounded-lg border transition-all ${
                          isActive
                            ? 'border-error/40 bg-error/5'
                            : 'border-border hover:border-error/20 bg-bg/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 px-2.5 py-2">
                          <span className="text-sm shrink-0">{scenario.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-text truncate">{scenario.name}</span>
                              {isActive && (
                                <span className="px-1 py-0 rounded text-[7px] font-bold bg-error/20 text-error uppercase">ON</span>
                              )}
                            </div>
                            <div className="text-[9px] text-text-dim truncate">{scenario.description}</div>
                            <div className="text-[8px] text-text-dim mt-0.5">
                              {compatible.length} compatible node{compatible.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => handleInjectClick(scenario)}
                            disabled={compatible.length === 0 || isInjecting}
                            className={`shrink-0 px-2 py-1 rounded text-[9px] font-semibold transition-all ${
                              isInjecting
                                ? 'bg-error/30 text-error animate-pulse'
                                : compatible.length === 0
                                ? 'bg-bg text-text-dim cursor-not-allowed opacity-50'
                                : isActive
                                ? 'bg-error/20 text-error hover:bg-error/30 border border-error/30'
                                : 'bg-error/10 text-error hover:bg-error/20 border border-error/20'
                            }`}
                          >
                            {isInjecting ? (
                              <><Clock className="w-2.5 h-2.5 animate-spin inline" /> ...</>
                            ) : isActive ? (
                              'Re-apply'
                            ) : (
                              'Inject'
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Target Selection Modal */}
      {targetSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTargetSelector(null)}>
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl w-[480px] max-h-[70vh] overflow-hidden flex flex-col"
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
    </div>
  )
}
