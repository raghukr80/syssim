// Type declarations for WASM simulation engine
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

export declare class SimulationController {
  init(diagram: DiagramData): Promise<void>
  start(): void
  pause(): void
  resume(): void
  stop(): void
  step(): SimulationResult | null
  setSpeed(multiplier: number): void
  getMetrics(): SimulationResult | null
}

export declare const simulationController: SimulationController
