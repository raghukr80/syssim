// @ts-nocheck
// WASM Simulation Controller
// Bridges the React frontend to the Rust/WASM simulation engine

import init, { SimController } from './sim_engine.js'

export interface DiagramData {
  nodes: any[]
  edges: any[]
}

export interface SimulationResult {
  systemMetrics: {
    totalRps: number
    p99: number
    errorRate: number
    bottleneckCount: number
    history: any[]
    componentMetrics: Record<string, any>
  }
  nodeMetrics: Record<string, any>
}

// Convert snake_case WASM output to camelCase for the frontend
function convertMetrics(wasmMetrics: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [id, m] of Object.entries(wasmMetrics)) {
    result[id] = {
      currentRps: m.current_rps ?? 0,
      avgLatency: m.avg_latency_ms ?? 0,
      p99Latency: m.p99_latency_ms ?? 0,
      errorRate: m.error_rate ?? 0,
      queueDepth: m.queue_depth ?? 0,
      utilization: m.utilization ?? 0,
    }
  }
  return result
}

function parseResult(json: string): SimulationResult | null {
  try {
    const raw = JSON.parse(json)
    console.log('[WASM parseResult] raw keys:', Object.keys(raw), 'sample:', JSON.stringify(raw).slice(0, 200))
    // WASM returns snake_case from Rust serde
    return {
      systemMetrics: {
        totalRps: raw.total_rps ?? raw.totalRps ?? 0,
        p99: raw.p99_latency_ms ?? raw.p99 ?? 0,
        errorRate: raw.error_rate ?? raw.errorRate ?? 0,
        bottleneckCount: raw.bottleneck_count ?? raw.bottleneckCount ?? 0,
        history: raw.latency_history ?? raw.history ?? [],
        componentMetrics: convertMetrics(raw.component_metrics ?? raw.componentMetrics ?? {}),
      },
      nodeMetrics: convertMetrics(raw.component_metrics ?? raw.componentMetrics ?? {}),
    }
  } catch {
    return null
  }
}

class SimulationController {
  private wasmReady = false
  private controller: SimController | null = null

  async init(diagram: DiagramData) {
    try {
      await init()
      this.controller = new SimController()

      // Add components from diagram
      for (const node of diagram.nodes) {
        const config = JSON.stringify(node.data.config)
        this.controller!.addComponent(node.id, node.data.componentType, config)
      }

      // Add connections
      for (const edge of diagram.edges) {
        this.controller!.addConnection(edge.source, edge.target)
      }

      this.wasmReady = true
      console.log('WASM simulation engine initialized with', diagram.nodes.length, 'components')
    } catch (e) {
      console.warn('WASM init failed, using JS fallback:', e)
      this.wasmReady = false
      throw e // Re-throw so caller knows to use JS fallback
    }
  }

  start() {
    if (!this.wasmReady || !this.controller) return
    this.controller.start()
  }

  pause() {
    if (!this.controller) return
    this.controller.pause()
  }

  resume() {
    if (!this.controller) return
    this.controller.resume()
  }

  stop() {
    if (!this.controller) return
    this.controller.stop()
  }

  step(): SimulationResult | null {
    if (!this.controller) return null
    const result = this.controller.step()
    return parseResult(result)
  }

  setSpeed(multiplier: number) {
    if (!this.controller) return
    this.controller.setSpeed(multiplier)
  }

  getMetrics(): SimulationResult | null {
    if (!this.controller) return null
    const result = this.controller.getMetrics()
    return parseResult(result)
  }
}

export const simulationController = new SimulationController()
