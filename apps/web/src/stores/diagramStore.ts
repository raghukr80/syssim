import { create } from 'zustand'
import type { SimNode, SimEdge, SimulationState, SystemMetrics, ComponentConfig, ChaosScenario, SimEvent, SimulationReport } from '../types'

interface HistoryEntry {
  nodes: SimNode[]
  edges: SimEdge[]
}

interface NodeEventStats {
  totalRps: number
  rpsSamples: number
  totalLatency: number
  latencySamples: number
  totalUtilization: number
  utilSamples: number
  peakErrorRate: number
  errorRateSamples: number
  statusDurations: Record<string, number>
}

interface DiagramStore {
  // Diagram state
  nodes: SimNode[]
  edges: SimEdge[]
  selectedNodeIds: string[]
  selectedEdgeIds: string[]

  // History (undo/redo)
  history: HistoryEntry[]
  historyIndex: number

  // Simulation state
  simState: SimulationState
  systemMetrics: SystemMetrics
  speedMultiplier: number
  trafficMultiplier: number

  // Chaos
  activeChaos: { scenario: ChaosScenario; targetNodeId: string; startTime: number }[]

  // Event log
  events: SimEvent[]
  simTick: number
  showEventLog: boolean
  showReport: boolean
  lastReport: SimulationReport | null
  nodeEventStats: Record<string, NodeEventStats>

  // UI state
  showMetrics: boolean
  showChaos: boolean
  clearVersion: number
  deselectVersion: number
  theme: 'dark' | 'light'
  title: string

  // Actions
  setNodes: (nodes: SimNode[]) => void
  setEdges: (edges: SimEdge[]) => void
  addNode: (node: SimNode) => void
  updateNodeConfig: (nodeId: string, config: Partial<ComponentConfig>) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  updateNodeTag: (nodeId: string, tag: string) => void
  updateNodeColor: (nodeId: string, color: string) => void
  updateNodeIcon: (nodeId: string, icon: string) => void
  updateNodeMetrics: (nodeId: string, metrics: SimNode['data']['metrics']) => void
  updateNodeStatus: (nodeId: string, status: SimNode['data']['status']) => void
  removeNodes: (nodeIds: string[]) => void
  addEdge: (edge: SimEdge) => void
  removeEdges: (edgeIds: string[]) => void
  setSelectedNodes: (ids: string[]) => void
  setSelectedEdges: (ids: string[]) => void

  // History
  pushHistory: () => void
  undo: () => void
  redo: () => void

  // Simulation
  setSimState: (state: SimulationState) => void
  setSystemMetrics: (metrics: SystemMetrics) => void
  setSpeedMultiplier: (speed: number) => void
  setTrafficMultiplier: (multiplier: number) => void

  // Chaos
  injectChaos: (scenario: ChaosScenario, targetNodeId: string) => void
  removeChaos: (scenarioId: string) => void
  clearAllChaos: () => void

  // Event log
  addEvent: (event: Omit<SimEvent, 'id' | 'timestamp' | 'tick'>) => void
  clearEvents: () => void
  setShowEventLog: (show: boolean) => void
  setShowReport: (show: boolean) => void
  generateReport: () => SimulationReport
  incrementTick: () => void

  // UI
  toggleMetrics: () => void
  toggleChaos: () => void
  toggleTheme: () => void
  setTitle: (title: string) => void
  deselectAll: () => void
  autoAlign: () => void

  // Import/Export
  exportDiagram: () => string
  importDiagram: (json: string) => void
  clearDiagram: () => void
  loadBlueprint: (nodes: SimNode[], edges: SimEdge[]) => void
}

const DEFAULT_METRICS: SystemMetrics = {
  totalRps: 0,
  systemP99: 0,
  errorRate: 0,
  bottleneckCount: 0,
  latencyHistory: [],
  componentMetrics: {},
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  history: [],
  historyIndex: -1,
  simState: 'idle',
  systemMetrics: DEFAULT_METRICS,
  speedMultiplier: 1,
  trafficMultiplier: 1,
  activeChaos: [],
  events: [],
  simTick: 0,
  showEventLog: true,
  showReport: false,
  lastReport: null,
  nodeEventStats: {},
  showMetrics: false,
  showChaos: false,
  clearVersion: 0,
  deselectVersion: 0,
  theme: 'dark' as const,
  title: 'Untitled Design',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    const state = get()
    state.pushHistory()
    set({ nodes: [...state.nodes, node] })
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } }
          : n
      ),
    })
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
      ),
    })
  },

  updateNodeTag: (nodeId, tag) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, tag } } : n
      ),
    })
  },

  updateNodeColor: (nodeId, color) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, color } } : n
      ),
    })
  },

  updateNodeIcon: (nodeId, icon) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, icon } } : n
      ),
    })
  },

  updateNodeMetrics: (nodeId, metrics) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, metrics: metrics ?? undefined } }
          : n
      ),
    })
  },

  updateNodeStatus: (nodeId, status) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status } }
          : n
      ),
    })
  },

  removeNodes: (nodeIds) => {
    const state = get()
    state.pushHistory()
    const idSet = new Set(nodeIds)
    set({
      nodes: state.nodes.filter(n => !idSet.has(n.id)),
      edges: state.edges.filter(e => !idSet.has(e.source) && !idSet.has(e.target)),
      selectedNodeIds: state.selectedNodeIds.filter(id => !idSet.has(id)),
    })
  },

  addEdge: (edge) => {
    const state = get()
    state.pushHistory()
    set({ edges: [...state.edges, edge] })
  },

  removeEdges: (edgeIds) => {
    const state = get()
    state.pushHistory()
    const idSet = new Set(edgeIds)
    set({
      edges: state.edges.filter(e => !idSet.has(e.id)),
      selectedEdgeIds: state.selectedEdgeIds.filter(id => !idSet.has(id)),
    })
  },

  setSelectedNodes: (ids) => set({ selectedNodeIds: ids }),
  setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),

  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) })
    if (newHistory.length > 50) newHistory.shift()
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= 0) {
      const entry = history[historyIndex]
      set({
        nodes: JSON.parse(JSON.stringify(entry.nodes)),
        edges: JSON.parse(JSON.stringify(entry.edges)),
        historyIndex: historyIndex - 1,
      })
    }
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 2) {
      const entry = history[historyIndex + 2]
      set({
        nodes: JSON.parse(JSON.stringify(entry.nodes)),
        edges: JSON.parse(JSON.stringify(entry.edges)),
        historyIndex: historyIndex + 1,
      })
    }
  },

  setSimState: (state) => set({ simState: state }),
  setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),
  setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),
  setTrafficMultiplier: (mult) => set({ trafficMultiplier: mult }),

  injectChaos: (scenario, targetNodeId) => {
    const node = get().nodes.find(n => n.id === targetNodeId)
    set({
      activeChaos: [...get().activeChaos, { scenario, targetNodeId, startTime: Date.now() }],
    })
    // Log chaos event
    get().addEvent({
      nodeId: targetNodeId,
      nodeName: node?.data.label || targetNodeId,
      type: 'chaos_injected',
      severity: 'warning',
      message: `Chaos injected: ${scenario.name} on ${node?.data.label || targetNodeId}`,
      details: scenario.description,
    })
  },

  removeChaos: (scenarioId) => {
    set({
      activeChaos: get().activeChaos.filter(c => c.scenario.id !== scenarioId),
    })
  },

  clearAllChaos: () => {
    set({ activeChaos: [] })
  },

  // ── Event log ──
  addEvent: (event) => {
    const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    set(state => ({
      events: [...state.events.slice(-499), { ...event, id, timestamp: Date.now(), tick: state.simTick }],
    }))
  },

  clearEvents: () => set({ events: [], simTick: 0, nodeEventStats: {} }),

  setShowEventLog: (show) => set({ showEventLog: show }),
  setShowReport: (show) => set({ showReport: show }),

  incrementTick: () => set(state => ({ simTick: state.simTick + 1 })),

  generateReport: () => {
    const state = get()
    const nodes = state.nodes
    const events = state.events
    const stats = state.nodeEventStats

    // Build node summaries
    const nodeSummaries = nodes.map(node => {
      const ns = stats[node.id]
      const nodeEvents = events.filter(e => e.nodeId === node.id)
      return {
        nodeId: node.id,
        nodeName: node.data.label,
        nodeType: node.data.componentType,
        maxRps: node.data.config.maxRps,
        avgRps: ns && ns.rpsSamples > 0 ? Math.round(ns.totalRps / ns.rpsSamples) : 0,
        avgLatency: ns && ns.latencySamples > 0 ? Math.round(ns.totalLatency / ns.latencySamples) : 0,
        avgUtilization: ns && ns.utilSamples > 0 ? ns.totalUtilization / ns.utilSamples : 0,
        peakErrorRate: ns ? ns.peakErrorRate : 0,
        status: node.data.status,
        events: nodeEvents.length,
      }
    })

    // Build incidents from critical/warning events
    const incidents = events
      .filter(e => e.severity === 'critical' || e.severity === 'warning')
      .slice(-200)
      .map(e => {
        const time = new Date(e.timestamp)
        const ts = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`
        return {
          timestamp: ts,
          componentId: e.nodeId || '',
          componentName: e.nodeName || 'System',
          issue: e.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          explanation: e.details || e.message,
          severity: e.severity === 'critical' ? 80 : 50,
          recommendation: getRecommendation(e.type),
        }
      })

    // Deduplicate recommendations
    const recommendationSet = new Set<string>()
    const recommendations: string[] = []
    incidents.forEach(inc => {
      if (inc.recommendation && !recommendationSet.has(inc.recommendation)) {
        recommendationSet.add(inc.recommendation)
        recommendations.push(inc.recommendation)
      }
    })

    // Compute summary
    const totalRequests = nodeSummaries.reduce((sum, n) => sum + n.avgRps * state.simTick * 0.5, 0)
    const avgSuccessRate = nodeSummaries.length > 0
      ? nodeSummaries.reduce((sum, n) => sum + (1 - n.peakErrorRate), 0) / nodeSummaries.length
      : 1
    const avgP99 = nodeSummaries.length > 0
      ? nodeSummaries.reduce((sum, n) => sum + n.avgLatency, 0) / nodeSummaries.length
      : 0

    const report: SimulationReport = {
      generatedAt: Date.now(),
      scenarioName: undefined,
      duration: state.simTick,
      summary: {
        finalAvailability: Math.round(avgSuccessRate * 1000) / 10,
        p99Latency: Math.round(avgP99),
        totalRequests: Math.round(totalRequests),
        successRate: Math.round(avgSuccessRate * 10000) / 100,
        errorBudgetRemaining: Math.max(0, Math.round((1 - avgSuccessRate) * 1000) / 10),
      },
      incidents,
      recommendations: recommendations.slice(0, 20),
      nodeSummaries,
    }

    set({ lastReport: report, showReport: true })
    return report
  },

  // UI
  toggleMetrics: () => set({ showMetrics: !get().showMetrics }),
  toggleChaos: () => set({ showChaos: !get().showChaos }),
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: newTheme })
    if (newTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('syssim-theme', newTheme)
  },
  setTitle: (title: string) => set({ title }),
  deselectAll: () => set({ selectedNodeIds: [], selectedEdgeIds: [], deselectVersion: get().deselectVersion + 1 }),

  // ── Auto Align — arranges nodes in a grid layout ──
  autoAlign: () => {
    const nodes = get().nodes
    if (nodes.length === 0) return

    const padding = 40
    const nodeWidth = 160
    const nodeHeight = 100
    const cols = Math.ceil(Math.sqrt(nodes.length))

    const alignedNodes = nodes.map((node, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      return {
        ...node,
        position: {
          x: padding + col * (nodeWidth + padding),
          y: padding + row * (nodeHeight + padding),
        },
      }
    })

    set({ nodes: alignedNodes })
  },

  exportDiagram: () => {
    const { nodes, edges } = get()
    return JSON.stringify({ version: '1.0', nodes, edges }, null, 2)
  },

  importDiagram: (json) => {
    try {
      const data = JSON.parse(json)
      if (data.nodes && data.edges) {
        get().pushHistory()
        set({ nodes: data.nodes, edges: data.edges })
      }
    } catch (e) {
      console.error('Failed to import diagram:', e)
    }
  },

  clearDiagram: () => {
    get().pushHistory()
    set({ nodes: [], edges: [], selectedNodeIds: [], selectedEdgeIds: [], clearVersion: get().clearVersion + 1 })
  },

  loadBlueprint: (bpNodes, bpEdges) => {
    get().pushHistory()
    set({ nodes: bpNodes, edges: bpEdges, selectedNodeIds: [], selectedEdgeIds: [] })
  },
}))

// ── Event type → recommendation lookup ──
function getRecommendation(eventType: string): string {
  const map: Record<string, string> = {
    high_latency: 'Investigate node health, restart or replace slow instance',
    high_error_rate: 'Enable autoscaling and add redundancy to reduce error pressure',
    high_utilization: 'Enable autoscaling and scale toward ~2 instances. Reduce hot keys or inefficient sync dependencies.',
    utilization_spike: 'Reduce hot paths, right-size CPU limits, and add horizontal headroom before the next burst.',
    rps_overflow: 'Enable autoscaling (min 2, max >= 2) and add a parallel replica on the same upstream path.',
    rate_limited: 'Add capacity, smooth bursts, or adjust edge quotas to match backend health.',
    cache_oom: 'Set an appropriate maxmemory-policy (allkeys-lru or volatile-lru). Increase maxmemory or add shards.',
    spof_detected: 'Increase instance count, enable autoscaling, or add a redundant node',
    connection_pool_full: 'Raise pool capacity carefully, reuse connections more aggressively, and reduce downstream fan-out.',
    consumer_lag: 'Scale workers, split noisy queues, and keep backlog age bounded before SLA-sensitive work slips.',
    thread_starvation: 'Increase worker capacity, isolate blocking operations, and cap concurrency on the slowest code path.',
    memory_pressure: 'Lower per-request memory, stream large payloads, and add guardrails before heap pressure turns into restarts.',
    health_check_failure: 'Enable health checks at the upstream routing layer so unhealthy instances stop receiving live traffic.',
    dependency_unavailable: 'Fix health checks, add healthy instances, and tune autoscaling so capacity is ready sooner.',
    cascading_failure: 'Add timeouts, circuit breakers, or async fallback to isolate downstream failures',
    error_budget_burn: 'Treat this as an SLO warning: slow the rollout, lower retry pressure, and stabilize latency before traffic increases.',
    constraint_violation: 'Inspect hot write keys, validate payloads before commit, and align uniqueness/foreign-key rules with the current write path.',
    schema_migration: 'Use expand-migrate-contract rollouts and gate incompatible readers/writers.',
    config_drift: 'Reconcile edge configuration and confirm consistent health policy across the fleet.',
    chaos_injected: 'Review chaos experiment impact and verify recovery procedures are working correctly.',
    node_failed: 'Check node logs, restart the instance, and verify health checks are passing.',
    node_degraded: 'Monitor closely — consider scaling or replacing the degraded node.',
  }
  return map[eventType] || 'Investigate and remediate the issue based on observed symptoms.'
}
