import type { SimNode, SimEdge } from '../types'

export interface Blueprint {
  id: string
  name: string
  description: string
  icon: string
  nodes: SimNode[]
  edges: SimEdge[]
}

// Helper to create node with position
function n(id: string, type: SimNode['data']['componentType'], label: string, x: number, y: number, config?: Partial<SimNode['data']['config']>): SimNode {
  const defaults: Record<string, SimNode['data']['config']> = {
    client: { maxRps: 100000, latencyP50: 0, latencyP95: 0, latencyP99: 0, connectionLimit: 0, failureRate: 0 },
    dns: { maxRps: 50000, latencyP50: 5, latencyP95: 10, latencyP99: 20, connectionLimit: 10000, failureRate: 0.001 },
    cdn: { maxRps: 100000, latencyP50: 10, latencyP95: 25, latencyP99: 50, connectionLimit: 50000, failureRate: 0.001, cacheHitRatio: 0.85 },
    load_balancer: { maxRps: 50000, latencyP50: 1, latencyP95: 3, latencyP99: 8, connectionLimit: 100000, failureRate: 0.001 },
    api_gateway: { maxRps: 30000, latencyP50: 3, latencyP95: 8, latencyP99: 20, connectionLimit: 20000, failureRate: 0.002 },
    web_server: { maxRps: 5000, latencyP50: 20, latencyP95: 80, latencyP99: 200, connectionLimit: 2000, failureRate: 0.01 },
    serverless: { maxRps: 10000, latencyP50: 50, latencyP95: 200, latencyP99: 500, connectionLimit: 3000, failureRate: 0.005 },
    container_cluster: { maxRps: 20000, latencyP50: 15, latencyP95: 60, latencyP99: 150, connectionLimit: 10000, failureRate: 0.005 },
    cache: { maxRps: 100000, latencyP50: 1, latencyP95: 3, latencyP99: 8, connectionLimit: 50000, failureRate: 0.001, cacheHitRatio: 0.9 },
    database: { maxRps: 10000, latencyP50: 5, latencyP95: 30, latencyP99: 100, connectionLimit: 5000, failureRate: 0.005, replicationFactor: 2 },
    storage: { maxRps: 50000, latencyP50: 20, latencyP95: 80, latencyP99: 200, connectionLimit: 10000, failureRate: 0.001 },
    message_queue: { maxRps: 50000, latencyP50: 5, latencyP95: 20, latencyP99: 50, connectionLimit: 20000, failureRate: 0.002, partitionCount: 6 },
    event_bus: { maxRps: 100000, latencyP50: 10, latencyP95: 50, latencyP99: 150, connectionLimit: 50000, failureRate: 0.001 },
    third_party_api: { maxRps: 5000, latencyP50: 50, latencyP95: 200, latencyP99: 500, connectionLimit: 1000, failureRate: 0.02 },
  }
  const defaultConfig = defaults[type] || defaults.web_server
  return {
    id,
    type: 'simComponent',
    position: { x, y },
    data: {
      componentType: type,
      label,
      config: { ...defaultConfig, ...config },
      status: 'idle',
    },
  }
}

function e(id: string, source: string, target: string, label?: string): SimEdge {
  return { id, source, target, type: 'simConnection', data: { label } }
}

// ─── Blueprint 1: 3-Tier Web App ──────────────────────────────────
const tier3Nodes: SimNode[] = [
  n('client', 'client', 'Client', 400, 20),
  n('dns1', 'dns', 'Route 53', 400, 120),
  n('cdn1', 'cdn', 'CloudFront CDN', 400, 220),
  n('lb1', 'load_balancer', 'ALB', 400, 330),
  n('web1', 'web_server', 'Web Server 1', 220, 450),
  n('web2', 'web_server', 'Web Server 2', 580, 450),
  n('cache1', 'cache', 'Redis Cache', 100, 570),
  n('db1', 'database', 'RDS Primary', 400, 570),
  n('db2', 'database', 'RDS Replica', 700, 570),
]

const tier3Edges: SimEdge[] = [
  e('e1', 'client', 'dns1'),
  e('e2', 'dns1', 'cdn1'),
  e('e3', 'cdn1', 'lb1'),
  e('e4', 'lb1', 'web1'),
  e('e5', 'lb1', 'web2'),
  e('e6', 'web1', 'cache1'),
  e('e7', 'web2', 'cache1'),
  e('e8', 'web1', 'db1'),
  e('e9', 'web2', 'db1'),
  e('e10', 'db1', 'db2', 'replication'),
]

// ─── Blueprint 2: Microservices ──────────────────────────────────
const microNodes: SimNode[] = [
  n('client2', 'client', 'Mobile/Web Client', 500, 20),
  n('dns2', 'dns', 'Route 53', 500, 110),
  n('gw2', 'api_gateway', 'API Gateway', 500, 210),
  n('auth', 'serverless', 'Auth Service', 150, 330),
  n('svc1', 'container_cluster', 'User Service', 370, 330),
  n('svc2', 'container_cluster', 'Order Service', 590, 330),
  n('evt', 'event_bus', 'EventBridge', 370, 450),
  n('mq', 'message_queue', 'Kafka (MSK)', 590, 450),
  n('usr_db', 'database', 'Users DB', 150, 570),
  n('ord_db', 'database', 'Orders DB', 490, 570),
  n('cache2', 'cache', 'Redis', 730, 570),
  n('search', 'serverless', 'Search Service', 730, 330),
]

const microEdges: SimEdge[] = [
  e('m1', 'client2', 'dns2'),
  e('m2', 'dns2', 'gw2'),
  e('m3', 'gw2', 'auth'),
  e('m4', 'gw2', 'svc1'),
  e('m5', 'gw2', 'svc2'),
  e('m6', 'gw2', 'search'),
  e('m7', 'svc1', 'usr_db'),
  e('m8', 'svc2', 'ord_db'),
  e('m9', 'svc1', 'evt'),
  e('m10', 'svc2', 'evt'),
  e('m11', 'evt', 'mq'),
  e('m12', 'svc2', 'cache2'),
]

// ─── Blueprint 3: Event-Driven Data Pipeline ─────────────────────
const pipelineNodes: SimNode[] = [
  n('src', 'client', 'Data Sources', 500, 20),
  n('gw3', 'api_gateway', 'Ingestion GW', 500, 130),
  n('mq3', 'message_queue', 'Kafka (MSK)', 300, 250),
  n('proc', 'container_cluster', 'Stream Processor', 300, 370),
  n('dlq', 'message_queue', 'Dead Letter Queue', 100, 370),
  n('wh', 'serverless', 'Warehouse Loader', 300, 490),
  n('lake', 'storage', 'S3 Data Lake', 300, 600),
  n('svc3', 'container_cluster', 'Query Service', 550, 370),
  n('cache3', 'cache', 'Redis', 550, 490),
  n('query', 'serverless', 'Query API', 550, 600),
  n('lb3', 'load_balancer', 'ALB', 750, 600),
  n('viewer', 'client', 'Analyst', 950, 600),
]

const pipelineEdges: SimEdge[] = [
  e('p1', 'src', 'gw3'),
  e('p2', 'gw3', 'mq3'),
  e('p3', 'mq3', 'proc'),
  e('p4', 'proc', 'dlq', 'failed'),
  e('p5', 'proc', 'wh'),
  e('p6', 'wh', 'lake'),
  e('p7', 'proc', 'svc3'),
  e('p8', 'svc3', 'cache3'),
  e('p9', 'svc3', 'query'),
  e('p10', 'query', 'lb3'),
  e('p11', 'lb3', 'viewer'),
]

// ─── Blueprint 4: Serverless API ────────────────────────────────
const serverlessNodes: SimNode[] = [
  n('client4', 'client', 'Client', 400, 20),
  n('cdn4', 'cdn', 'CloudFront', 400, 120),
  n('gw4', 'api_gateway', 'API Gateway', 400, 220),
  n('auth4', 'serverless', 'Auth Lambda', 150, 340),
  n('api1', 'serverless', 'Get Items', 350, 340),
  n('api2', 'serverless', 'Create Item', 550, 340),
  n('db4', 'database', 'DynamoDB', 250, 460),
  n('s3', 'storage', 'S3 Bucket', 450, 460),
  n('evt4', 'event_bus', 'EventBridge', 650, 460),
  n('proc4', 'serverless', 'Async Processor', 650, 570),
]

const serverlessEdges: SimEdge[] = [
  e('s1', 'client4', 'cdn4'),
  e('s2', 'cdn4', 'gw4'),
  e('s3', 'gw4', 'auth4'),
  e('s4', 'gw4', 'api1'),
  e('s5', 'gw4', 'api2'),
  e('s6', 'api1', 'db4'),
  e('s7', 'api2', 'db4'),
  e('s8', 'api2', 's3'),
  e('s9', 'api2', 'evt4'),
  e('s10', 'evt4', 'proc4'),
]

export const BLUEPRINTS: Blueprint[] = [
  {
    id: '3-tier',
    name: '3-Tier Web App',
    description: 'Classic 3-tier architecture with CDN, load balancer, web servers, cache, and database replication.',
    icon: '🏗️',
    nodes: tier3Nodes,
    edges: tier3Edges,
  },
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Microservices architecture with API Gateway, container cluster, event bus, and Kafka.',
    icon: '🔬',
    nodes: microNodes,
    edges: microEdges,
  },
  {
    id: 'event-pipeline',
    name: 'Event-Driven Pipeline',
    description: 'Data ingestion pipeline with Kafka, stream processing, S3 data lake, and query layer.',
    icon: '⚡',
    nodes: pipelineNodes,
    edges: pipelineEdges,
  },
  {
    id: 'serverless-api',
    name: 'Serverless API',
    description: 'Serverless REST API with Lambda, API Gateway, DynamoDB, S3, and async EventBridge.',
    icon: '🚀',
    nodes: serverlessNodes,
    edges: serverlessEdges,
  },
]
