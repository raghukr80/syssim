// ============================================================
// Core domain types for the system design simulator
// ============================================================

export type ComponentCategory = 'networking' | 'compute' | 'data' | 'messaging' | 'security' | 'observability' | 'ml' | 'custom' | 'external'

export type ComponentType =
  // Networking
  | 'load_balancer'
  | 'api_gateway'
  | 'cdn'
  | 'dns'
  | 'waf'
  | 'vpc'
  | 'nat_gateway'
  | 'service_mesh'
  | 'api_management'
  | 'sidecar_proxy'
  | 'rate_limiter'
  | 'circuit_breaker'

  // Compute
  | 'web_server'
  | 'serverless'
  | 'container_cluster'
  | 'microservice'
  | 'graphql'
  | 'websocket'
  | 'worker'
  | 'cron_job'

  // Data
  | 'database'
  | 'cache'
  | 'storage'
  | 'search_engine'
  | 'graph_database'
  | 'time_series_db'
  | 'document_store'
  | 'key_value_store'
  | 'data_warehouse'
  | 'data_lake'

  // Messaging
  | 'message_queue'
  | 'event_bus'
  | 'notification_service'
  | 'email_service'
  | 'sms_service'

  // Security
  | 'identity_provider'
  | 'secrets_manager'
  | 'certificate_manager'
  | 'ddos_protection'

  // Observability
  | 'monitoring'
  | 'logging'
  | 'tracing'
  | 'alerting'

  // ML/AI
  | 'ml_model'
  | 'ml_training'
  | 'feature_store'
  | 'vector_search'
  | 'recommendation_engine'

  // Custom
  | 'custom_component'

  // External
  | 'third_party_api'
  | 'client'

export interface ComponentConfig {
  // Common fields
  maxRps: number
  latencyP50: number   // ms
  latencyP95: number   // ms
  latencyP99: number   // ms
  connectionLimit: number
  failureRate: number  // 0-1

  // Cache-specific
  cacheHitRatio?: number        // 0-1, for cache nodes
  cacheTtlSeconds?: number      // TTL for cache entries
  maxMemoryMb?: number          // Max memory in MB

  // Database-specific
  replicationFactor?: number    // Number of replicas
  partitionCount?: number       // Number of partitions/shards
  readReplicas?: number         // Read replica count
  writeConsistency?: 'strong' | 'eventual' | 'session'  // Consistency level
  storageGb?: number            // Storage size in GB
  iops?: number                 // IOPS capacity

  // Queue/Messaging-specific
  messageRetentionHours?: number  // How long messages are retained
  maxMessageSizeKb?: number       // Max message size in KB
  consumerCount?: number          // Number of consumers
  deliveryGuarantee?: 'at-most-once' | 'at-least-once' | 'exactly-once'

  // Load Balancer-specific
  lbAlgorithm?: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted'
  algorithm?: 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted'  // alias for backwards compat
  healthCheckInterval?: number    // seconds
  sslTermination?: boolean        // SSL offloading

  // Sidecar Proxy-specific
  proxyMode?: 'sidecar' | 'gateway' | 'ingress'  // Deployment mode
  protocol?: 'http' | 'grpc' | 'tcp' | 'http2'  // Supported protocols
  mtlsEnabled?: boolean           // Mutual TLS enabled
  trafficSplit?: Record<string, number>  // Canary deployments

  // Rate Limiter-specific
  rlAlgorithm?: 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window' | 'sliding-log'
  rateLimitRps?: number           // Requests per second limit
  burstLimit?: number             // Burst allowance
  keyType?: 'ip' | 'user' | 'header' | 'custom'  // Rate limit key
  scope?: 'global' | 'per-instance' | 'per-route'  // Rate limit scope

  // Circuit Breaker-specific
  failureThreshold?: number       // Failure % to trip (0-100)
  successThreshold?: number       // Successes to close (after half-open)
  cbTimeout?: number              // Open state duration (ms)
  timeout?: number                // Request timeout in ms (alias for backwards compat)
  halfOpenRequests?: number       // Requests allowed in half-open state
  monitoredEndpoints?: string[]   // Specific endpoints to monitor

  // Compute-specific
  autoScale?: boolean             // Auto-scaling enabled
  minInstances?: number           // Min instances for auto-scaling
  maxInstances?: number           // Max instances for auto-scaling
  cpuCores?: number               // CPU cores per instance
  memoryGb?: number               // Memory per instance in GB

  // Serverless-specific
  timeoutMs?: number              // Function timeout in ms
  concurrency?: number            // Max concurrent executions
  coldStartMs?: number            // Cold start latency in ms

  // CDN-specific
  edgeLocations?: number          // Number of edge locations
  cacheTtlMinutes?: number        // CDN cache TTL in minutes
  originShield?: boolean          // Origin shield enabled

  // Storage-specific
  storageClass?: 'standard' | 'infrequent' | 'archive' | 'glacier'
  versioning?: boolean            // Object versioning enabled
  encryption?: boolean            // Server-side encryption

  // External/Third-party
  extRateLimitRps?: number        // Rate limit in RPS
  extTimeout?: number             // Request timeout in ms
  retryCount?: number             // Number of retries
  circuitBreaker?: boolean        // Circuit breaker enabled
}

export interface SimNode {
  id: string
  type: 'simComponent'
  position: { x: number; y: number }
  data: {
    componentType: ComponentType
    label: string
    tag?: string
    color?: string
    icon?: string
    config: ComponentConfig
    status: 'idle' | 'running' | 'degraded' | 'failed'
    metrics?: ComponentMetrics
  }
}

export interface SimEdge {
  id: string
  source: string
  target: string
  type: 'simConnection'
  data?: {
    label?: string
    protocol?: string
  }
}

export interface ComponentMetrics {
  currentRps: number
  avgLatency: number
  p99Latency: number
  errorRate: number
  queueDepth: number
  utilization: number  // 0-1
}

export type SimulationState = 'idle' | 'running' | 'paused' | 'stopped'

export interface SystemMetrics {
  totalRps: number
  systemP99: number
  errorRate: number
  bottleneckCount: number
  latencyHistory: LatencySample[]
  componentMetrics: Record<string, ComponentMetrics>
}

export interface LatencySample {
  timestamp: number
  p50: number
  p95: number
  p99: number
}

export type ChaosCategory = 'network' | 'infrastructure' | 'traffic' | 'data' | 'application' | 'dependency'

export interface ChaosScenario {
  id: string
  name: string
  category: ChaosCategory
  description: string
  targetTypes: ComponentType[]
  // Effect parameters
  latencyInjection?: { delayMs: number; jitterMs: number }
  failureRate?: number
  bandwidthLimitMbps?: number
  cpuSpike?: number
  memoryPressure?: number
  duration?: number  // seconds, undefined = permanent until removed
}

export interface CostEstimate {
  compute: number    // $/month
  storage: number
  networking: number
  requests: number
  total: number
  // Multi-cloud costs
  awsTotal: number
  azureTotal: number
  gcpTotal: number
}

// ── Event Log Types ──

export type EventSeverity = 'info' | 'warning' | 'critical'

export interface SimEvent {
  id: string
  timestamp: number               // Date.now()
  tick: number                    // simulation tick number
  nodeId?: string                 // which node this event relates to
  nodeName?: string               // human-readable label
  type: string                    // event type key e.g. 'high_latency', 'spof', 'chaos_injected'
  severity: EventSeverity
  message: string                 // human-readable description
  details?: string                // longer explanation
  metric?: {
    key: string                   // e.g. 'p99Latency', 'errorRate', 'utilization'
    value: number
    threshold: number
  }
}

// ── Simulation Report Types ──

export interface SimulationReport {
  generatedAt: number
  scenarioName?: string
  duration: number                // ticks
  summary: {
    finalAvailability: number     // percentage
    p99Latency: number
    totalRequests: number
    successRate: number
    errorBudgetRemaining: number
  }
  incidents: ReportIncident[]
  recommendations: string[]
  nodeSummaries: NodeSimulationSummary[]
}

export interface ReportIncident {
  timestamp: string               // HH:MM:SS formatted
  componentId: string
  componentName: string
  issue: string                   // issue type
  explanation: string             // description
  severity: number                // 0-100
  recommendation: string
}

export interface NodeSimulationSummary {
  nodeId: string
  nodeName: string
  nodeType: ComponentType
  maxRps: number
  avgRps: number
  avgLatency: number
  avgUtilization: number
  peakErrorRate: number
  status: string
  events: number                  // count of events for this node
}

// Component metadata for the palette
export interface ComponentMeta {
  type: ComponentType
  label: string
  category: ComponentCategory
  description: string
  icon: string
  defaultConfig: ComponentConfig
  awsService: string
  awsCostPerMonth: number  // base cost
  azureCostPerMonth: number  // base cost
  gcpCostPerMonth: number  // base cost
  cloudEquivalents: {
    aws: string
    azure: string
    gcp: string
    oss: string
  }
}
