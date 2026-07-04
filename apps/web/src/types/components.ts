import { ComponentMeta, ComponentCategory } from '../types'

export const COMPONENT_META: ComponentMeta[] = [
  // ═══════════════════════════════════════════
  // NETWORKING
  // ═══════════════════════════════════════════
  {
    type: 'load_balancer',
    label: 'Load Balancer',
    category: 'networking',
    description: 'Distributes incoming requests across backend servers',
    icon: '⚖️',
    defaultConfig: {
      maxRps: 50000, latencyP50: 1, latencyP95: 2, latencyP99: 5,
      connectionLimit: 10000, failureRate: 0.001,
      algorithm: 'round-robin', healthCheckInterval: 10, sslTermination: true,
    },
    awsService: 'ALB',
    awsCostPerMonth: 22,
    cloudEquivalents: {
      aws: 'ALB / NLB / CLB',
      azure: 'Azure Load Balancer / Application Gateway',
      gcp: 'Cloud Load Balancing',
      oss: 'HAProxy, NGINX, Traefik, Envoy'
    }
  },
  {
    type: 'api_gateway',
    label: 'API Gateway',
    category: 'networking',
    description: 'Rate limiting, auth, request routing, API versioning',
    icon: '🚪',
    defaultConfig: {
      maxRps: 10000, latencyP50: 5, latencyP95: 15, latencyP99: 50,
      connectionLimit: 5000, failureRate: 0.001,
      rateLimitRps: 10000, timeout: 30000, retryCount: 3, circuitBreaker: true,
    },
    awsService: 'API Gateway',
    awsCostPerMonth: 35,
    cloudEquivalents: {
      aws: 'API Gateway',
      azure: 'API Management',
      gcp: 'API Gateway / Cloud Endpoints',
      oss: 'Kong, Traefik, Tyk, KrakenD'
    }
  },
  {
    type: 'api_management',
    label: 'API Management',
    category: 'networking',
    description: 'Full lifecycle API management with developer portal',
    icon: '🔐',
    defaultConfig: {
      maxRps: 20000, latencyP50: 3, latencyP95: 10, latencyP99: 30,
      connectionLimit: 10000, failureRate: 0.001,
      rateLimitRps: 20000, timeout: 30000, retryCount: 2, circuitBreaker: true,
    },
    awsService: 'API Gateway (Enterprise)',
    awsCostPerMonth: 120,
    cloudEquivalents: {
      aws: 'API Gateway (Enterprise)',
      azure: 'API Management (Premium)',
      gcp: 'Apigee',
      oss: 'Kong Enterprise, Tyk, WSO2'
    }
  },
  {
    type: 'cdn',
    label: 'CDN',
    category: 'networking',
    description: 'Edge caching for static and dynamic content delivery',
    icon: '🌐',
    defaultConfig: {
      maxRps: 100000, latencyP50: 10, latencyP95: 30, latencyP99: 80,
      connectionLimit: 50000, failureRate: 0.0001,
      edgeLocations: 200, cacheTtlMinutes: 60, originShield: true,
    },
    awsService: 'CloudFront',
    awsCostPerMonth: 85,
    cloudEquivalents: {
      aws: 'CloudFront',
      azure: 'Azure CDN / Front Door',
      gcp: 'Cloud CDN',
      oss: 'Varnish, NGINX, Caddy, Cloudflare (self-hosted)'
    }
  },
  {
    type: 'dns',
    label: 'DNS',
    category: 'networking',
    description: 'Domain resolution with TTL caching and health checks',
    icon: '🔍',
    defaultConfig: {
      maxRps: 100000, latencyP50: 5, latencyP95: 20, latencyP99: 50,
      connectionLimit: 100000, failureRate: 0.0001,
    },
    awsService: 'Route 53',
    awsCostPerMonth: 50,
    cloudEquivalents: {
      aws: 'Route 53',
      azure: 'Azure DNS',
      gcp: 'Cloud DNS',
      oss: 'CoreDNS, PowerDNS, BIND, Unbound'
    }
  },
  {
    type: 'waf',
    label: 'WAF',
    category: 'networking',
    description: 'Web Application Firewall — SQL injection, XSS, bot protection',
    icon: '🛡️',
    defaultConfig: {
      maxRps: 50000, latencyP50: 2, latencyP95: 5, latencyP99: 15,
      connectionLimit: 50000, failureRate: 0.001,
      rateLimitRps: 50000, timeout: 10000, circuitBreaker: false,
    },
    awsService: 'WAF',
    awsCostPerMonth: 30,
    cloudEquivalents: {
      aws: 'WAF',
      azure: 'Azure WAF / Front Door WAF',
      gcp: 'Cloud Armor',
      oss: 'ModSecurity, NAXSI, CrowdSec, Coraza'
    }
  },
  {
    type: 'vpc',
    label: 'VPC',
    category: 'networking',
    description: 'Virtual Private Cloud — network isolation and segmentation',
    icon: '🏗️',
    defaultConfig: {
      maxRps: 1000000, latencyP50: 0.5, latencyP95: 1, latencyP99: 3,
      connectionLimit: 1000000, failureRate: 0.0001,
    },
    awsService: 'VPC',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'VPC',
      azure: 'Virtual Network (VNet)',
      gcp: 'VPC Network',
      oss: 'OpenVPN, WireGuard, Tailscale, Calico'
    }
  },
  {
    type: 'nat_gateway',
    label: 'NAT Gateway',
    category: 'networking',
    description: 'Network Address Translation for private subnet internet access',
    icon: '🔄',
    defaultConfig: {
      maxRps: 50000, latencyP50: 1, latencyP95: 3, latencyP99: 10,
      connectionLimit: 50000, failureRate: 0.001,
    },
    awsService: 'NAT Gateway',
    awsCostPerMonth: 32,
    cloudEquivalents: {
      aws: 'NAT Gateway',
      azure: 'NAT Gateway',
      gcp: 'Cloud NAT',
      oss: 'iptables/nftables, NAT instance, FRR'
    }
  },
  {
    type: 'service_mesh',
    label: 'Service Mesh',
    category: 'networking',
    description: 'mTLS, traffic management, observability between services',
    icon: '🕸️',
    defaultConfig: {
      maxRps: 100000, latencyP50: 1, latencyP95: 3, latencyP99: 8,
      connectionLimit: 100000, failureRate: 0.001,
      timeout: 10000, retryCount: 3, circuitBreaker: true,
    },
    awsService: 'App Mesh',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'App Mesh',
      azure: 'Open Service Mesh / Azure Service Mesh',
      gcp: 'Traffic Director / Anthos Service Mesh',
      oss: 'Istio, Linkerd, Consul Connect, Kuma'
    }
  },
  {
    type: 'sidecar_proxy',
    label: 'Sidecar Proxy',
    category: 'networking',
    description: 'Sidecar proxy for mTLS, traffic splitting, and resilience patterns (Envoy/Linkerd)',
    icon: '🔀',
    defaultConfig: {
      maxRps: 10000, latencyP50: 2, latencyP95: 5, latencyP99: 20,
      connectionLimit: 10000, failureRate: 0.001,
      proxyMode: 'sidecar', protocol: 'http', mtlsEnabled: true,
      trafficSplit: {},
    },
    awsService: 'App Mesh (Envoy)',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'App Mesh (Envoy)',
      azure: 'Open Service Mesh (Envoy)',
      gcp: 'Anthos Service Mesh (Envoy)',
      oss: 'Envoy, Linkerd2-proxy, Traefik Mesh'
    }
  },
  {
    type: 'rate_limiter',
    label: 'Rate Limiter',
    category: 'networking',
    description: 'Request rate limiting with multiple algorithms and burst handling',
    icon: '🚦',
    defaultConfig: {
      maxRps: 10000, latencyP50: 1, latencyP95: 3, latencyP99: 10,
      connectionLimit: 10000, failureRate: 0.001,
      rlAlgorithm: 'token-bucket', rateLimitRps: 1000, burstLimit: 2000,
      keyType: 'ip', scope: 'per-instance',
    },
    awsService: 'API Gateway + Lambda@Edge',
    awsCostPerMonth: 15,
    cloudEquivalents: {
      aws: 'API Gateway Usage Plans / Lambda@Edge',
      azure: 'API Management Rate Limits / Front Door Rules',
      gcp: 'API Gateway Quotas / Cloud Armor Rate Limiting',
      oss: 'Envoy Rate Limit, NGINX limit_req, Kong Rate Limiting, Traefik RateLimit'
    }
  },
  {
    type: 'circuit_breaker',
    label: 'Circuit Breaker',
    category: 'networking',
    description: 'Automatic failure detection and circuit breaking for downstream services',
    icon: '🔌',
    defaultConfig: {
      maxRps: 10000, latencyP50: 1, latencyP95: 3, latencyP99: 10,
      connectionLimit: 10000, failureRate: 0.001,
      failureThreshold: 50, successThreshold: 5, timeout: 30000,
      halfOpenRequests: 10, monitoredEndpoints: [],
    },
    awsService: 'App Mesh / API Gateway',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'App Mesh / API Gateway',
      azure: 'Open Service Mesh / API Management Policies',
      gcp: 'Traffic Director / Cloud Load Balancing',
      oss: 'Istio DestinationRule, Hystrix, Resilience4j, GoBreaker, PyBreaker'
    }
  },

  // ═══════════════════════════════════════════
  // COMPUTE
  // ═══════════════════════════════════════════
  {
    type: 'web_server',
    label: 'App Server',
    category: 'compute',
    description: 'Application server handling business logic',
    icon: '🖥️',
    defaultConfig: {
      maxRps: 2000, latencyP50: 20, latencyP95: 80, latencyP99: 200,
      connectionLimit: 500, failureRate: 0.01,
      autoScale: true, minInstances: 2, maxInstances: 10,
      cpuCores: 2, memoryGb: 8,
    },
    awsService: 'EC2 (m5.large)',
    awsCostPerMonth: 70,
    cloudEquivalents: {
      aws: 'EC2 / Elastic Beanstalk',
      azure: 'Azure App Service / VMSS',
      gcp: 'Compute Engine / Cloud Run',
      oss: 'Apache, NGINX, Express, Flask, FastAPI',
    }
  },
  {
    type: 'microservice',
    label: 'Microservice',
    category: 'compute',
    description: 'Single-purpose service with its own data store',
    icon: '🧩',
    defaultConfig: {
      maxRps: 3000, latencyP50: 10, latencyP95: 40, latencyP99: 100,
      connectionLimit: 300, failureRate: 0.008,
      autoScale: true, minInstances: 2, maxInstances: 15,
      cpuCores: 1, memoryGb: 4,
    },
    awsService: 'ECS/Fargate',
    awsCostPerMonth: 60,
    cloudEquivalents: {
      aws: 'ECS / EKS',
      azure: 'Container Apps / AKS',
      gcp: 'Cloud Run / GKE',
      oss: 'Spring Boot, Express, FastAPI, Flask',
    }
  },
  {
    type: 'serverless',
    label: 'Serverless',
    category: 'compute',
    description: 'Function-as-a-Service with auto-scaling and pay-per-use',
    icon: '⚡',
    defaultConfig: {
      maxRps: 1000, latencyP50: 50, latencyP95: 200, latencyP99: 1000,
      connectionLimit: 1000, failureRate: 0.005,
      timeoutMs: 30000, concurrency: 1000, coldStartMs: 200,
    },
    awsService: 'Lambda',
    awsCostPerMonth: 20,
    cloudEquivalents: {
      aws: 'Lambda',
      azure: 'Azure Functions',
      gcp: 'Cloud Functions',
      oss: 'OpenFaaS, Kubeless, Fn Project, Knative',
    }
  },
  {
    type: 'container_cluster',
    label: 'Container Cluster',
    category: 'compute',
    description: 'Kubernetes-style auto-scaling container orchestration',
    icon: '📦',
    defaultConfig: {
      maxRps: 5000, latencyP50: 15, latencyP95: 60, latencyP99: 150,
      connectionLimit: 2000, failureRate: 0.005,
      autoScale: true, minInstances: 2, maxInstances: 20,
      cpuCores: 4, memoryGb: 16,
    },
    awsService: 'EKS/Fargate',
    awsCostPerMonth: 150,
    cloudEquivalents: {
      aws: 'EKS / Fargate',
      azure: 'AKS / Container Apps',
      gcp: 'GKE / Cloud Run',
      oss: 'Kubernetes, Docker Swarm, Nomad, OpenShift',
    }
  },
  {
    type: 'graphql',
    label: 'GraphQL API',
    category: 'compute',
    description: 'Flexible query API with schema stitching and federation',
    icon: '◈',
    defaultConfig: {
      maxRps: 5000, latencyP50: 15, latencyP95: 50, latencyP99: 150,
      connectionLimit: 2000, failureRate: 0.005,
      autoScale: true, minInstances: 2, maxInstances: 10,
      cpuCores: 2, memoryGb: 8,
    },
    awsService: 'AppSync',
    awsCostPerMonth: 40,
    cloudEquivalents: {
      aws: 'AppSync',
      azure: 'API Management / Apollo',
      gcp: 'Apollo GraphQL / Cloud Run',
      oss: 'Apollo Server, GraphQL Yoga, Hasura, Mercurius',
    }
  },
  {
    type: 'websocket',
    label: 'WebSocket Server',
    category: 'compute',
    description: 'Real-time bidirectional communication server',
    icon: '🔌',
    defaultConfig: {
      maxRps: 10000, latencyP50: 5, latencyP95: 20, latencyP99: 50,
      connectionLimit: 50000, failureRate: 0.002,
      autoScale: true, minInstances: 2, maxInstances: 10,
      cpuCores: 2, memoryGb: 4,
    },
    awsService: 'API Gateway (WebSocket)',
    awsCostPerMonth: 25,
    cloudEquivalents: {
      aws: 'API Gateway (WebSocket) / IoT',
      azure: 'Azure Web PubSub / SignalR',
      gcp: 'Cloud Pub/Sub + Cloud Run',
      oss: 'Socket.io, uWebSockets, Gorilla WebSocket, Centrifugo, Phoenix Channels',
    }
  },
  {
    type: 'worker',
    label: 'Background Worker',
    category: 'compute',
    description: 'Async job processor consuming from queues',
    icon: '⚙️',
    defaultConfig: {
      maxRps: 500, latencyP50: 100, latencyP95: 500, latencyP99: 2000,
      connectionLimit: 100, failureRate: 0.01,
      autoScale: true, minInstances: 1, maxInstances: 10,
      cpuCores: 2, memoryGb: 4,
    },
    awsService: 'EC2 (Worker)',
    awsCostPerMonth: 50,
    cloudEquivalents: {
      aws: 'EC2 / ECS Worker',
      azure: 'Container Apps / Functions (Worker)',
      gcp: 'Cloud Run Jobs / Cloud Tasks',
      oss: 'Sidekiq, Celery, BullMQ, Laravel Queue, Hangfire',
    }
  },
  {
    type: 'cron_job',
    label: 'Cron Job',
    category: 'compute',
    description: 'Scheduled task runner for periodic batch operations',
    icon: '⏰',
    defaultConfig: {
      maxRps: 100, latencyP50: 1000, latencyP95: 5000, latencyP99: 30000,
      connectionLimit: 10, failureRate: 0.02,
      timeoutMs: 900000, concurrency: 10, coldStartMs: 0,
    },
    awsService: 'EventBridge + Lambda',
    awsCostPerMonth: 5,
    cloudEquivalents: {
      aws: 'EventBridge Scheduler / Lambda',
      azure: 'Azure Logic Apps / Functions Cron',
      gcp: 'Cloud Scheduler / Cloud Functions',
      oss: 'Linux cron, Kubernetes CronJob, Airflow DAG, Cavalcade',
    }
  },

  // ═══════════════════════════════════════════
  // DATA & STORAGE
  // ═══════════════════════════════════════════
  {
    type: 'database',
    label: 'Database',
    category: 'data',
    description: 'Primary relational database (PostgreSQL-compatible)',
    icon: '🗄️',
    defaultConfig: {
      maxRps: 5000, latencyP50: 5, latencyP95: 20, latencyP99: 80,
      connectionLimit: 200, failureRate: 0.005,
      replicationFactor: 2, readReplicas: 1, writeConsistency: 'strong',
      storageGb: 100, iops: 3000, partitionCount: 1,
    },
    awsService: 'RDS PostgreSQL',
    awsCostPerMonth: 120,
    cloudEquivalents: {
      aws: 'RDS / Aurora (PostgreSQL)',
      azure: 'Azure Database for PostgreSQL / Cosmos DB',
      gcp: 'Cloud SQL / Cloud Spanner',
      oss: 'PostgreSQL, MySQL, MariaDB, CockroachDB',
    }
  },
  {
    type: 'cache',
    label: 'Cache (Redis)',
    category: 'data',
    description: 'In-memory cache with configurable hit ratio and TTL',
    icon: '💾',
    defaultConfig: {
      maxRps: 50000, latencyP50: 1, latencyP95: 3, latencyP99: 10,
      connectionLimit: 10000, failureRate: 0.001,
      cacheHitRatio: 0.95, cacheTtlSeconds: 300, maxMemoryMb: 1024,
    },
    awsService: 'ElastiCache Redis',
    awsCostPerMonth: 45,
    cloudEquivalents: {
      aws: 'ElastiCache (Redis/Memcached)',
      azure: 'Azure Cache for Redis / Managed Redis',
      gcp: 'Memorystore',
      oss: 'Redis, Memcached, Hazelcast, KeyDB, Dragonfly',
    }
  },
  {
    type: 'storage',
    label: 'Object Storage',
    category: 'data',
    description: 'Durable object storage (S3-compatible)',
    icon: '🪣',
    defaultConfig: {
      maxRps: 5000, latencyP50: 20, latencyP95: 80, latencyP99: 200,
      connectionLimit: 1000, failureRate: 0.0001,
      storageClass: 'standard', versioning: true, encryption: true,
    },
    awsService: 'S3',
    awsCostPerMonth: 23,
    cloudEquivalents: {
      aws: 'S3',
      azure: 'Azure Blob Storage',
      gcp: 'Cloud Storage',
      oss: 'MinIO, Ceph, Garage, SeaweedFS',
    }
  },
  {
    type: 'search_engine',
    label: 'Search Engine',
    category: 'data',
    description: 'Full-text search with inverted indices (Elasticsearch)',
    icon: '🔎',
    defaultConfig: {
      maxRps: 3000, latencyP50: 10, latencyP95: 50, latencyP99: 200,
      connectionLimit: 500, failureRate: 0.005,
      replicationFactor: 2, readReplicas: 1, writeConsistency: 'eventual',
      storageGb: 50, iops: 1000, partitionCount: 3,
    },
    awsService: 'OpenSearch',
    awsCostPerMonth: 100,
    cloudEquivalents: {
      aws: 'OpenSearch / Elasticsearch Service',
      azure: 'Azure Cognitive Search / Elastic Cloud',
      gcp: 'Elasticsearch on GCE / Vertex AI Search',
      oss: 'Elasticsearch, OpenSearch, Solr, Meilisearch, Typesense',
    }
  },
  {
    type: 'graph_database',
    label: 'Graph Database',
    category: 'data',
    description: 'Relationship-focused database for connected data (Neo4j)',
    icon: '🕸️',
    defaultConfig: {
      maxRps: 2000, latencyP50: 10, latencyP95: 50, latencyP99: 200,
      connectionLimit: 100, failureRate: 0.005,
      replicationFactor: 3, readReplicas: 0, writeConsistency: 'strong',
      storageGb: 50, iops: 2000, partitionCount: 1,
    },
    awsService: 'Neptune',
    awsCostPerMonth: 150,
    cloudEquivalents: {
      aws: 'Neptune',
      azure: 'Cosmos DB (Gremlin)',
      gcp: 'JanusGraph on GCE',
      oss: 'Neo4j, JanusGraph, ArangoDB, Dgraph, SurrealDB',
    }
  },
  {
    type: 'time_series_db',
    label: 'Time Series DB',
    category: 'data',
    description: 'Optimized for time-stamped metrics and events (InfluxDB)',
    icon: '📈',
    defaultConfig: {
      maxRps: 50000, latencyP50: 2, latencyP95: 10, latencyP99: 30,
      connectionLimit: 1000, failureRate: 0.001,
      replicationFactor: 2, readReplicas: 0, writeConsistency: 'eventual',
      storageGb: 500, iops: 5000, partitionCount: 12,
    },
    awsService: 'Timestream',
    awsCostPerMonth: 80,
    cloudEquivalents: {
      aws: 'Timestream',
      azure: 'Azure Data Explorer / Time Series Insights',
      gcp: 'BigQuery + Cloud Monitoring',
      oss: 'InfluxDB, TimescaleDB, Prometheus, VictoriaMetrics, QuestDB',
    }
  },
  {
    type: 'document_store',
    label: 'Document Store',
    category: 'data',
    description: 'Schema-flexible document database (MongoDB-compatible)',
    icon: '📄',
    defaultConfig: {
      maxRps: 10000, latencyP50: 5, latencyP95: 20, latencyP99: 60,
      connectionLimit: 500, failureRate: 0.003,
      replicationFactor: 3, readReplicas: 2, writeConsistency: 'eventual',
      storageGb: 100, iops: 3000, partitionCount: 4,
    },
    awsService: 'DocumentDB',
    awsCostPerMonth: 90,
    cloudEquivalents: {
      aws: 'DocumentDB',
      azure: 'Cosmos DB (Core SQL / MongoDB API)',
      gcp: 'Firestore / Datastore',
      oss: 'MongoDB, Couchbase, CouchDB, RethinkDB, Firestore (OSS)',
    }
  },
  {
    type: 'key_value_store',
    label: 'Key-Value Store',
    category: 'data',
    description: 'Ultra-low latency key-value lookups (DynamoDB)',
    icon: '🔑',
    defaultConfig: {
      maxRps: 100000, latencyP50: 1, latencyP95: 5, latencyP99: 15,
      connectionLimit: 100000, failureRate: 0.0001,
      replicationFactor: 3, readReplicas: 0, writeConsistency: 'eventual',
      storageGb: 100, iops: 10000, partitionCount: 10,
    },
    awsService: 'DynamoDB',
    awsCostPerMonth: 60,
    cloudEquivalents: {
      aws: 'DynamoDB',
      azure: 'Azure Cosmos DB / Table Storage',
      gcp: 'Bigtable / Firestore',
      oss: 'Cassandra, ScyllaDB, FoundationDB, RocksDB, LevelDB',
    }
  },
  {
    type: 'data_warehouse',
    label: 'Data Warehouse',
    category: 'data',
    description: 'Analytical database for complex queries (Redshift)',
    icon: '🏭',
    defaultConfig: {
      maxRps: 100, latencyP50: 500, latencyP95: 5000, latencyP99: 30000,
      connectionLimit: 50, failureRate: 0.001,
      replicationFactor: 1, readReplicas: 0, writeConsistency: 'strong',
      storageGb: 1000, iops: 5000, partitionCount: 1,
    },
    awsService: 'Redshift',
    awsCostPerMonth: 300,
    cloudEquivalents: {
      aws: 'Redshift / Athena',
      azure: 'Azure Synapse Analytics / Fabric',
      gcp: 'BigQuery',
      oss: 'ClickHouse, Apache Druid, Pinot, DuckDB, Apache Doris',
    }
  },
  {
    type: 'data_lake',
    label: 'Data Lake',
    category: 'data',
    description: 'Large-scale raw data storage for analytics (S3 + Athena)',
    icon: '🏞️',
    defaultConfig: {
      maxRps: 1000, latencyP50: 1000, latencyP95: 10000, latencyP99: 60000,
      connectionLimit: 100, failureRate: 0.001,
      storageClass: 'standard', versioning: true, encryption: true,
    },
    awsService: 'S3 + Athena',
    awsCostPerMonth: 50,
    cloudEquivalents: {
      aws: 'S3 + Athena + Lake Formation',
      azure: 'Azure Data Lake Storage (ADLS) Gen2',
      gcp: 'Cloud Storage + BigQuery',
      oss: 'Apache Iceberg, Delta Lake, Apache Hudi, MinIO, Presto/Trino',
    }
  },

  // ═══════════════════════════════════════════
  // MESSAGING
  // ═══════════════════════════════════════════
  {
    type: 'message_queue',
    label: 'Message Queue',
    category: 'messaging',
    description: 'Async message broker with partitioning (Kafka-compatible)',
    icon: '📨',
    defaultConfig: {
      maxRps: 10000, latencyP50: 5, latencyP95: 20, latencyP99: 100,
      connectionLimit: 5000, failureRate: 0.001,
      partitionCount: 6, messageRetentionHours: 168, maxMessageSizeKb: 1024,
      consumerCount: 3, deliveryGuarantee: 'at-least-once',
    },
    awsService: 'MSK (Kafka)',
    awsCostPerMonth: 200,
    cloudEquivalents: {
      aws: 'MSK (Kafka) / SQS',
      azure: 'Azure Event Hubs / Service Bus',
      gcp: 'Cloud Pub/Sub',
      oss: 'Apache Kafka, RabbitMQ, ActiveMQ, Pulsar, NATS',
    }
  },
  {
    type: 'event_bus',
    label: 'Event Bus',
    category: 'messaging',
    description: 'Pub/sub event routing with content filtering',
    icon: '📡',
    defaultConfig: {
      maxRps: 20000, latencyP50: 10, latencyP95: 30, latencyP99: 100,
      connectionLimit: 10000, failureRate: 0.001,
      messageRetentionHours: 24, deliveryGuarantee: 'at-least-once',
    },
    awsService: 'EventBridge',
    awsCostPerMonth: 30,
    cloudEquivalents: {
      aws: 'EventBridge',
      azure: 'Azure Event Grid',
      gcp: 'Eventarc',
      oss: 'Apache Kafka, NATS, Apache Pulsar, RabbitMQ Streams',
    }
  },
  {
    type: 'notification_service',
    label: 'Push Notification',
    category: 'messaging',
    description: 'Mobile and web push notification delivery service',
    icon: '🔔',
    defaultConfig: {
      maxRps: 50000, latencyP50: 50, latencyP95: 200, latencyP99: 1000,
      connectionLimit: 100000, failureRate: 0.005,
      messageRetentionHours: 1, deliveryGuarantee: 'at-most-once',
    },
    awsService: 'SNS',
    awsCostPerMonth: 20,
    cloudEquivalents: {
      aws: 'SNS / Pinpoint',
      azure: 'Azure Notification Hubs',
      gcp: 'Firebase Cloud Messaging (FCM)',
      oss: 'Gotify, ntfy.sh, Apprise, Novu, OneSignal',
    }
  },
  {
    type: 'email_service',
    label: 'Email Service',
    category: 'messaging',
    description: 'Transactional and marketing email delivery (SES)',
    icon: '📧',
    defaultConfig: {
      maxRps: 1000, latencyP50: 200, latencyP95: 1000, latencyP99: 5000,
      connectionLimit: 500, failureRate: 0.01,
      messageRetentionHours: 0, deliveryGuarantee: 'at-least-once',
    },
    awsService: 'SES',
    awsCostPerMonth: 10,
    cloudEquivalents: {
      aws: 'SES',
      azure: 'Azure Communication Services Email',
      gcp: 'SendGrid + Gmail API',
      oss: 'Postfix, Exim, Mailgun, SendGrid (OSS SMTP), Postal',
    }
  },
  {
    type: 'sms_service',
    label: 'SMS Service',
    category: 'messaging',
    description: 'SMS and OTP delivery service',
    icon: '💬',
    defaultConfig: {
      maxRps: 100, latencyP50: 500, latencyP95: 2000, latencyP99: 10000,
      connectionLimit: 50, failureRate: 0.02,
      messageRetentionHours: 0, deliveryGuarantee: 'at-most-once',
    },
    awsService: 'SNS (SMS)',
    awsCostPerMonth: 15,
    cloudEquivalents: {
      aws: 'SNS (SMS) / End User Messaging',
      azure: 'Azure Communication Services SMS',
      gcp: 'Twilio + GCP',
      oss: 'Kannel, Jasmin SMS Gateway, PlaySMS, Twilio (API)',
    }
  },

  // ═══════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════
  {
    type: 'identity_provider',
    label: 'Identity Provider',
    category: 'security',
    description: 'Authentication and authorization (OAuth2/OIDC/SAML)',
    icon: '🪪',
    defaultConfig: {
      maxRps: 5000, latencyP50: 50, latencyP95: 200, latencyP99: 1000,
      connectionLimit: 10000, failureRate: 0.001,
      rateLimitRps: 5000, timeout: 10000, retryCount: 2, circuitBreaker: true,
    },
    awsService: 'Cognito',
    awsCostPerMonth: 25,
    cloudEquivalents: {
      aws: 'Cognito / IAM Identity Center',
      azure: 'Azure AD / Entra ID (B2C/B2B)',
      gcp: 'Identity Platform / Firebase Auth',
      oss: 'Keycloak, Auth0, Ory Kratos, SuperTokens, Authentik',
    }
  },
  {
    type: 'secrets_manager',
    label: 'Secrets Manager',
    category: 'security',
    description: 'Secure storage for API keys, passwords, and certificates',
    icon: '🔒',
    defaultConfig: {
      maxRps: 1000, latencyP50: 10, latencyP95: 30, latencyP99: 100,
      connectionLimit: 1000, failureRate: 0.001,
      rateLimitRps: 1000, timeout: 5000, retryCount: 3, circuitBreaker: false,
    },
    awsService: 'Secrets Manager',
    awsCostPerMonth: 5,
    cloudEquivalents: {
      aws: 'Secrets Manager / Parameter Store',
      azure: 'Azure Key Vault',
      gcp: 'Secret Manager',
      oss: 'HashiCorp Vault, OpenBao, Infisical, Doppler, Confidant',
    }
  },
  {
    type: 'certificate_manager',
    label: 'Certificate Manager',
    category: 'security',
    description: 'TLS certificate provisioning and rotation',
    icon: '📜',
    defaultConfig: {
      maxRps: 100, latencyP50: 100, latencyP95: 500, latencyP99: 2000,
      connectionLimit: 100, failureRate: 0.001,
      rateLimitRps: 100, timeout: 10000, retryCount: 2, circuitBreaker: false,
    },
    awsService: 'ACM',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'ACM',
      azure: 'Azure Key Vault Certificates',
      gcp: 'Certificate Manager',
      oss: 'Certbot (Let\'s Encrypt), Step CA, cfssl, HashiCorp Vault PKI, Smallstep',
    }
  },
  {
    type: 'ddos_protection',
    label: 'DDoS Protection',
    category: 'security',
    description: 'Distributed denial-of-service attack mitigation',
    icon: '🛡️',
    defaultConfig: {
      maxRps: 1000000, latencyP50: 1, latencyP95: 3, latencyP99: 10,
      connectionLimit: 1000000, failureRate: 0.0001,
      rateLimitRps: 1000000, timeout: 5000, circuitBreaker: false,
    },
    awsService: 'Shield Advanced',
    awsCostPerMonth: 3000,
    cloudEquivalents: {
      aws: 'Shield Advanced / CloudFront',
      azure: 'Azure DDoS Protection (Standard/Enterprise)',
      gcp: 'Cloud Armor (Enterprise)',
      oss: 'Cloudflare (Magic Transit), Fastly, DDoS Deflate, CrowdSec, Coraza',
    }
  },

  // ═══════════════════════════════════════════
  // OBSERVABILITY
  // ═══════════════════════════════════════════
  {
    type: 'monitoring',
    label: 'Monitoring',
    category: 'observability',
    description: 'Metrics collection, dashboards, and health checks',
    icon: '📊',
    defaultConfig: {
      maxRps: 10000, latencyP50: 5, latencyP95: 20, latencyP99: 50,
      connectionLimit: 10000, failureRate: 0.001,
    },
    awsService: 'CloudWatch',
    awsCostPerMonth: 15,
    cloudEquivalents: {
      aws: 'CloudWatch / Managed Grafana',
      azure: 'Azure Monitor / Managed Grafana',
      gcp: 'Cloud Monitoring / Managed Prometheus',
      oss: 'Prometheus, Grafana, Datadog Agent, SigNoz, Netdata',
    }
  },
  {
    type: 'logging',
    label: 'Log Aggregation',
    category: 'observability',
    description: 'Centralized log collection, search, and analysis',
    icon: '📋',
    defaultConfig: {
      maxRps: 50000, latencyP50: 10, latencyP95: 50, latencyP99: 200,
      connectionLimit: 50000, failureRate: 0.001,
    },
    awsService: 'CloudWatch Logs',
    awsCostPerMonth: 20,
    cloudEquivalents: {
      aws: 'CloudWatch Logs / OpenSearch',
      azure: 'Azure Monitor Logs / Log Analytics',
      gcp: 'Cloud Logging',
      oss: 'ELK/EFK Stack, Loki + Grafana, Graylog, Vector, Fluentd',
    }
  },
  {
    type: 'tracing',
    label: 'Distributed Tracing',
    category: 'observability',
    description: 'End-to-end request tracing across services (X-Ray)',
    icon: '🔬',
    defaultConfig: {
      maxRps: 10000, latencyP50: 2, latencyP95: 10, latencyP99: 30,
      connectionLimit: 10000, failureRate: 0.001,
    },
    awsService: 'X-Ray',
    awsCostPerMonth: 10,
    cloudEquivalents: {
      aws: 'X-Ray / CloudWatch RUM',
      azure: 'Azure Monitor Application Insights',
      gcp: 'Cloud Trace',
      oss: 'Jaeger, Zipkin, OpenTelemetry Collector, Grafana Tempo, SigNoz',
    }
  },
  {
    type: 'alerting',
    label: 'Alerting',
    category: 'observability',
    description: 'Incident alerting with escalation policies (PagerDuty)',
    icon: '🚨',
    defaultConfig: {
      maxRps: 100, latencyP50: 100, latencyP95: 500, latencyP99: 2000,
      connectionLimit: 100, failureRate: 0.001,
    },
    awsService: 'SNS + PagerDuty',
    awsCostPerMonth: 15,
    cloudEquivalents: {
      aws: 'SNS + Lambda / CloudWatch Alarms',
      azure: 'Azure Monitor Alerts / Action Groups',
      gcp: 'Cloud Monitoring Alerting',
      oss: 'Prometheus Alertmanager, Grafana Alerting, PagerDuty, Keep, Nightingale',
    }
  },

  // ═══════════════════════════════════════════
  // ML / AI
  // ═══════════════════════════════════════════
  {
    type: 'ml_model',
    label: 'ML Model Serving',
    category: 'ml',
    description: 'Model inference endpoint for predictions (SageMaker)',
    icon: '🤖',
    defaultConfig: {
      maxRps: 500, latencyP50: 50, latencyP95: 200, latencyP99: 1000,
      connectionLimit: 100, failureRate: 0.005,
      autoScale: true, minInstances: 1, maxInstances: 10,
      cpuCores: 4, memoryGb: 16,
      timeoutMs: 60000, concurrency: 100, coldStartMs: 5000,
    },
    awsService: 'SageMaker Endpoint',
    awsCostPerMonth: 200,
    cloudEquivalents: {
      aws: 'SageMaker Inference / Bedrock',
      azure: 'Azure ML Managed Endpoints / AI Studio',
      gcp: 'Vertex AI Prediction',
      oss: 'TensorFlow Serving, Triton, BentoML, Cortex, TorchServe',
    }
  },
  {
    type: 'ml_training',
    label: 'ML Training',
    category: 'ml',
    description: 'Batch model training pipeline with GPU support',
    icon: '🧠',
    defaultConfig: {
      maxRps: 10, latencyP50: 60000, latencyP95: 300000, latencyP99: 3600000,
      connectionLimit: 10, failureRate: 0.01,
      autoScale: false, minInstances: 1, maxInstances: 1,
      cpuCores: 16, memoryGb: 64,
      timeoutMs: 3600000, concurrency: 5, coldStartMs: 30000,
    },
    awsService: 'SageMaker Training',
    awsCostPerMonth: 500,
    cloudEquivalents: {
      aws: 'SageMaker Training',
      azure: 'Azure ML Compute Clusters',
      gcp: 'Vertex AI Training',
      oss: 'Ray Train, Kubeflow, MLflow, Determined AI, Horovod',
    }
  },
  {
    type: 'feature_store',
    label: 'Feature Store',
    category: 'ml',
    description: 'Centralized feature management for ML pipelines',
    icon: '🗃️',
    defaultConfig: {
      maxRps: 10000, latencyP50: 5, latencyP95: 20, latencyP99: 50,
      connectionLimit: 1000, failureRate: 0.001,
      replicationFactor: 2, readReplicas: 1, writeConsistency: 'strong',
      storageGb: 100, iops: 3000, partitionCount: 1,
    },
    awsService: 'SageMaker Feature Store',
    awsCostPerMonth: 40,
    cloudEquivalents: {
      aws: 'SageMaker Feature Store',
      azure: 'Azure ML Feature Store',
      gcp: 'Vertex AI Feature Store',
      oss: 'Feast, Tecton (OSS), Hopsworks, Chronon, Feathr',
    }
  },
  {
    type: 'vector_search',
    label: 'Vector Search',
    category: 'ml',
    description: 'Similarity search for embeddings and RAG (Pinecone)',
    icon: '🎯',
    defaultConfig: {
      maxRps: 5000, latencyP50: 10, latencyP95: 50, latencyP99: 200,
      connectionLimit: 500, failureRate: 0.005,
      replicationFactor: 2, readReplicas: 1, writeConsistency: 'eventual',
      storageGb: 50, iops: 2000, partitionCount: 1,
    },
    awsService: 'OpenSearch (k-NN)',
    awsCostPerMonth: 100,
    cloudEquivalents: {
      aws: 'OpenSearch (k-NN) / Bedrock KB',
      azure: 'Azure AI Search (Vector) / Cosmos DB Vector',
      gcp: 'Vertex AI Vector Search / AlloyDB',
      oss: 'Milvus, Weaviate, Qdrant, Chroma, LanceDB, Pinecone Lite',
    }
  },
  {
    type: 'recommendation_engine',
    label: 'Recommendation Engine',
    category: 'ml',
    description: 'Personalized recommendations with real-time inference',
    icon: '⭐',
    defaultConfig: {
      maxRps: 2000, latencyP50: 20, latencyP95: 80, latencyP99: 300,
      connectionLimit: 200, failureRate: 0.005,
      autoScale: true, minInstances: 2, maxInstances: 10,
      cpuCores: 4, memoryGb: 16,
      timeoutMs: 5000, concurrency: 500, coldStartMs: 2000,
    },
    awsService: 'Personalize',
    awsCostPerMonth: 150,
    cloudEquivalents: {
      aws: 'Personalize / SageMaker RT',
      azure: 'Azure Personalizer / Azure ML',
      gcp: 'Vertex AI (Recommendations AI / Retail)',
      oss: 'Cortex, BentoML, Merlin, LightFM, Implicit, Surprise',
    }
  },

  // ═══════════════════════════════════════════
  // CUSTOM
  // ═══════════════════════════════════════════
  {
    type: 'custom_component',
    label: 'Custom Component',
    category: 'custom',
    description: 'User-defined component with fully customizable configuration',
    icon: '✏️',
    defaultConfig: {
      maxRps: 1000, latencyP50: 20, latencyP95: 80, latencyP99: 200,
      connectionLimit: 500, failureRate: 0.01,
      autoScale: false, minInstances: 1, maxInstances: 1,
      cpuCores: 2, memoryGb: 4,
      timeoutMs: 30000, concurrency: 100, coldStartMs: 0,
      rateLimitRps: 1000, retryCount: 3, circuitBreaker: false,
      cacheHitRatio: 0.5, cacheTtlSeconds: 60, maxMemoryMb: 512,
      replicationFactor: 1, readReplicas: 0, writeConsistency: 'eventual',
      storageGb: 50, iops: 1000, partitionCount: 1,
      storageClass: 'standard', versioning: false, encryption: false,
      algorithm: 'round-robin', healthCheckInterval: 10, sslTermination: false,
      messageRetentionHours: 24, maxMessageSizeKb: 256, consumerCount: 1,
      deliveryGuarantee: 'at-least-once',
      edgeLocations: 50, cacheTtlMinutes: 10, originShield: false,
    },
    awsService: 'Custom',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'Custom (Any AWS Service)',
      azure: 'Custom (Any Azure Service)',
      gcp: 'Custom (Any GCP Service)',
      oss: 'Any OSS / Custom Stack',
    }
  },

  // ═══════════════════════════════════════════
  // EXTERNAL
  // ═══════════════════════════════════════════
  {
    type: 'third_party_api',
    label: 'Third-Party API',
    category: 'external',
    description: 'External service dependency with rate limits',
    icon: '🔗',
    defaultConfig: {
      maxRps: 100, latencyP50: 100, latencyP95: 500, latencyP99: 2000,
      connectionLimit: 50, failureRate: 0.02,
      rateLimitRps: 100, timeout: 5000, retryCount: 3, circuitBreaker: true,
    },
    awsService: 'N/A',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'N/A (External)',
      azure: 'N/A (External)',
      gcp: 'N/A (External)',
      oss: 'N/A (External)',
    }
  },
  {
    type: 'client',
    label: 'Client',
    category: 'external',
    description: 'End user or client application',
    icon: '👤',
    defaultConfig: {
      maxRps: 100000, latencyP50: 0, latencyP95: 0, latencyP99: 0,
      connectionLimit: 1000000, failureRate: 0,
    },
    awsService: 'N/A',
    awsCostPerMonth: 0,
    cloudEquivalents: {
      aws: 'N/A',
      azure: 'N/A',
      gcp: 'N/A',
      oss: 'N/A',
    }
  },
]

export const CATEGORIES: { key: ComponentCategory; label: string }[] = [
  { key: 'networking', label: 'Networking' },
  { key: 'compute', label: 'Compute' },
  { key: 'data', label: 'Data & Storage' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'security', label: 'Security' },
  { key: 'observability', label: 'Observability' },
  { key: 'ml', label: 'ML / AI' },
  { key: 'custom', label: 'Custom' },
  { key: 'external', label: 'External' },
]

export function getComponentMeta(type: string): ComponentMeta | undefined {
  return COMPONENT_META.find(m => m.type === type)
}