import type { Tool } from "@/types/tools"

export const TOOL_REGISTRY: Tool[] = [
  // ─── PLANNING & ANALYSIS ─────────────────────────────────
  {
    id: 'system-design-calculator',
    name: 'System Design Calculator',
    shortName: 'Calculator',
    description: 'Calculate QPS, bandwidth, storage, and latency requirements for system design',
    category: 'planning',
    difficulty: 'beginner',
    estimatedTimeMinutes: 5,
    icon: '🧮',
    color: 'text-blue-400',
    inputs: [
      { key: 'dailyUsers', label: 'Daily Active Users', type: 'number', defaultValue: 1000000, required: true },
      { key: 'requestsPerUser', label: 'Requests per User per Day', type: 'number', defaultValue: 10, required: true },
      { key: 'peakMultiplier', label: 'Peak Traffic Multiplier', type: 'number', defaultValue: 3, min: 1, max: 100 },
      { key: 'avgPayloadKB', label: 'Avg Request Payload (KB)', type: 'number', defaultValue: 5, min: 0.1, max: 10000 },
      { key: 'avgLatencyMs', label: 'Avg Latency per Request (ms)', type: 'number', defaultValue: 50, min: 1, max: 10000 },
      { key: 'cacheHitRatio', label: 'Cache Hit Ratio', type: 'number', defaultValue: 0.8, min: 0, max: 1, step: 0.05 },
    ],
    outputs: [
      { key: 'avgQps', label: 'Avg QPS', type: 'number' },
      { key: 'peakQps', label: 'Peak QPS', type: 'number' },
      { key: 'bandwidthMbps', label: 'Bandwidth (Mbps)', type: 'number', unit: 'Mbps' },
      { key: 'concurrency', label: 'Concurrent Requests', type: 'number' },
      { key: 'dailyStorageGB', label: 'Daily Storage (GB)', type: 'number', unit: 'GB' },
      { key: 'serversNeeded', label: 'Min Servers Needed', type: 'number' },
    ],
    compute: (inputs) => {
      const avgQps = (inputs.dailyUsers as number) * (inputs.requestsPerUser as number) / 86400;
      const peakQps = avgQps * (inputs.peakMultiplier as number);
      const bandwidthMbps = ((inputs.avgPayloadKB as number) * 1024 * 8 * avgQps) / 1e6;
      const concurrency = avgQps * ((inputs.avgLatencyMs as number) / 1000);
      const dailyStorageGB = (inputs.dailyUsers as number) * (inputs.requestsPerUser as number) * (inputs.avgPayloadKB as number) / 1e9;
      const serversNeeded = Math.ceil(peakQps / 1000);
      return {
        avgQps: Math.round(avgQps * 100) / 100,
        peakQps: Math.round(peakQps * 100) / 100,
        bandwidthMbps: Math.round(bandwidthMbps * 100) / 100,
        concurrency: Math.round(concurrency),
        dailyStorageGB: Math.round(dailyStorageGB * 100) / 100,
        serversNeeded,
      };
    },
    tags: ['qps', 'bandwidth', 'latency', 'storage', 'capacity'],
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Planning Tool',
    shortName: 'Capacity',
    description: 'Plan system capacity using Little\'s Law and traffic projections',
    category: 'planning',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '📊',
    color: 'text-blue-400',
    inputs: [
      { key: 'qps', label: 'Queries per Second', type: 'number', defaultValue: 1000, required: true },
      { key: 'avgLatencyMs', label: 'Avg Latency (ms)', type: 'number', defaultValue: 50, required: true },
      { key: 'targetUtilization', label: 'Target Utilization (%)', type: 'number', defaultValue: 70, min: 10, max: 100, step: 5 },
      { key: 'instanceCapacityQps', label: 'Per-Instance Capacity (QPS)', type: 'number', defaultValue: 500, required: true },
      { key: 'growthRate', label: 'Expected Growth Rate (%)', type: 'number', defaultValue: 50, min: 0, max: 1000 },
    ],
    outputs: [
      { key: 'concurrency', label: 'Concurrent Requests (Little\'s Law)', type: 'number' },
      { key: 'instancesNeeded', label: 'Instances Needed (Now)', type: 'number' },
      { key: 'instancesYear1', label: 'Instances Needed (Year 1)', type: 'number' },
      { key: 'headroom', label: 'Capacity Headroom (%)', type: 'number', unit: '%' },
      { key: 'maxSafeQps', label: 'Max Safe QPS', type: 'number' },
    ],
    compute: (inputs) => {
      const concurrency = (inputs.qps as number) * ((inputs.avgLatencyMs as number) / 1000);
      const instancesNeeded = Math.ceil((inputs.qps as number) / ((inputs.instanceCapacityQps as number) * (inputs.targetUtilization as number / 100)));
      const growth = (inputs.growthRate as number) / 100;
      const instancesYear1 = Math.ceil(instancesNeeded * (1 + growth));
      const headroom = ((inputs.targetUtilization as number) - (inputs.qps as number) / (instancesNeeded * (inputs.instanceCapacityQps as number))) * 100;
      const maxSafeQps = instancesNeeded * (inputs.instanceCapacityQps as number) * (inputs.targetUtilization as number / 100);
      return {
        concurrency: Math.round(concurrency),
        instancesNeeded,
        instancesYear1,
        headroom: Math.round(headroom * 100) / 100,
        maxSafeQps: Math.round(maxSafeQps),
      };
    },
    tags: ['capacity', 'planning', 'scaling', 'little-law', 'qps'],
  },
  {
    id: 'cloud-cost-estimator',
    name: 'Cloud Cost Estimator',
    shortName: 'Cloud Cost',
    description: 'Estimate monthly cloud costs across AWS, Azure, and GCP',
    category: 'planning',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 20,
    icon: '💰',
    color: 'text-blue-400',
    inputs: [
      { key: 'computeInstances', label: 'Compute Instances', type: 'number', defaultValue: 4, required: true },
      { key: 'computeHoursPerMonth', label: 'Hours/Month per Instance', type: 'number', defaultValue: 730 },
      { key: 'computeCostPerHour', label: 'Compute Cost/Hour ($)', type: 'number', defaultValue: 0.10 },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number', defaultValue: 100 },
      { key: 'storageCostPerGB', label: 'Storage Cost/GB/Month ($)', type: 'number', defaultValue: 0.10 },
      { key: 'transferTB', label: 'Data Transfer (TB/month)', type: 'number', defaultValue: 1 },
      { key: 'transferCostPerGB', label: 'Transfer Cost/GB ($)', type: 'number', defaultValue: 0.09 },
      { key: 'databaseHours', label: 'Database Hours/Month', type: 'number', defaultValue: 730 },
      { key: 'databaseCostPerHour', label: 'Database Cost/Hour ($)', type: 'number', defaultValue: 0.25 },
    ],
    outputs: [
      { key: 'computeCost', label: 'Compute Cost', type: 'number', unit: '$' },
      { key: 'storageCost', label: 'Storage Cost', type: 'number', unit: '$' },
      { key: 'transferCost', label: 'Data Transfer Cost', type: 'number', unit: '$' },
      { key: 'databaseCost', label: 'Database Cost', type: 'number', unit: '$' },
      { key: 'totalMonthly', label: 'Total Monthly Cost', type: 'number', unit: '$' },
      { key: 'totalAnnual', label: 'Total Annual Cost', type: 'number', unit: '$' },
    ],
    compute: (inputs) => {
      const computeCost = (inputs.computeInstances as number) * (inputs.computeHoursPerMonth as number) * (inputs.computeCostPerHour as number);
      const storageCost = (inputs.storageGB as number) * (inputs.storageCostPerGB as number);
      const transferCost = (inputs.transferTB as number) * 1000 * (inputs.transferCostPerGB as number);
      const databaseCost = (inputs.databaseHours as number) * (inputs.databaseCostPerHour as number);
      const totalMonthly = computeCost + storageCost + transferCost + databaseCost;
      const totalAnnual = totalMonthly * 12;
      return {
        computeCost: Math.round(computeCost * 100) / 100,
        storageCost: Math.round(storageCost * 100) / 100,
        transferCost: Math.round(transferCost * 100) / 100,
        databaseCost: Math.round(databaseCost * 100) / 100,
        totalMonthly: Math.round(totalMonthly * 100) / 100,
        totalAnnual: Math.round(totalAnnual * 100) / 100,
      };
    },
    tags: ['cost', 'cloud', 'aws', 'azure', 'gcp', 'budget'],
  },

  // ─── PERFORMANCE & OPTIMIZATION ──────────────────────────
  {
    id: 'bandwidth-calculator',
    name: 'Bandwidth Calculator',
    shortName: 'Bandwidth',
    description: 'Calculate bandwidth requirements based on message size and throughput',
    category: 'performance',
    difficulty: 'beginner',
    estimatedTimeMinutes: 10,
    icon: '📈',
    color: 'text-yellow-400',
    inputs: [
      { key: 'msgSizeBytes', label: 'Message Size (bytes)', type: 'number', defaultValue: 1024, required: true },
      { key: 'qps', label: 'Queries per Second', type: 'number', defaultValue: 1000, required: true },
      { key: 'overheadFactor', label: 'Protocol Overhead Factor', type: 'number', defaultValue: 1.2, min: 1, max: 3 },
      { key: 'replicationFactor', label: 'Replication Factor', type: 'number', defaultValue: 1, min: 1, max: 10 },
      { key: 'compressionRatio', label: 'Compression Ratio (0=none)', type: 'number', defaultValue: 0, min: 0, max: 0.99 },
    ],
    outputs: [
      { key: 'bandwidthMbps', label: 'Bandwidth Required', type: 'number', unit: 'Mbps' },
      { key: 'bandwidthGbps', label: 'Bandwidth (Gbps)', type: 'number', unit: 'Gbps' },
      { key: 'monthlyTransferTB', label: 'Monthly Transfer', type: 'number', unit: 'TB' },
      { key: 'perReplicaMbps', label: 'Per-Replica Bandwidth', type: 'number', unit: 'Mbps' },
    ],
    compute: (inputs) => {
      const effectiveSize = (inputs.msgSizeBytes as number) * (1 - (inputs.compressionRatio as number));
      const bandwidthMbps = (effectiveSize * (inputs.qps as number) * (inputs.overheadFactor as number) * 8) / 1e6;
      const bandwidthGbps = bandwidthMbps / 1000;
      const monthlyTransferTB = (bandwidthMbps * 1e6 / 8 * 2592000) / 1e12;
      const perReplicaMbps = bandwidthMbps * (inputs.replicationFactor as number);
      return {
        bandwidthMbps: Math.round(bandwidthMbps * 100) / 100,
        bandwidthGbps: Math.round(bandwidthGbps * 1000) / 1000,
        monthlyTransferTB: Math.round(monthlyTransferTB * 100) / 100,
        perReplicaMbps: Math.round(perReplicaMbps * 100) / 100,
      };
    },
    tags: ['bandwidth', 'throughput', 'network', 'compression'],
  },
  {
    id: 'latency-simulator',
    name: 'Latency Simulator',
    shortName: 'Latency',
    description: 'Simulate queueing behavior with M/M/1 and M/M/c models',
    category: 'performance',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 10,
    icon: '⏱️',
    color: 'text-yellow-400',
    inputs: [
      { key: 'arrivalRate', label: 'Arrival Rate (req/sec)', type: 'number', defaultValue: 80, required: true },
      { key: 'serviceRate', label: 'Service Rate per Server (req/sec)', type: 'number', defaultValue: 100, required: true },
      { key: 'numServers', label: 'Number of Servers', type: 'number', defaultValue: 1, min: 1, max: 100 },
    ],
    outputs: [
      { key: 'utilization', label: 'Server Utilization (ρ)', type: 'number' },
      { key: 'avgQueueLength', label: 'Avg Queue Length (Lq)', type: 'number' },
      { key: 'avgWaitTime', label: 'Avg Wait Time (Wq)', type: 'number', unit: 'sec' },
      { key: 'avgResponseTime', label: 'Avg Response Time (W)', type: 'number', unit: 'sec' },
      { key: 'p99WaitTime', label: 'P99 Wait Time', type: 'number', unit: 'sec' },
      { key: 'isStable', label: 'System Stable', type: 'text' },
    ],
    compute: (inputs) => {
      const lambda = inputs.arrivalRate as number;
      const mu = inputs.serviceRate as number;
      const c = inputs.numServers as number;
      const rho = lambda / (c * mu);
      const isStable = rho < 1;
      let avgQueueLength = 0;
      let avgWaitTime = 0;
      let avgResponseTime = 0;
      let p99WaitTime = 0;
      if (c === 1) {
        if (isStable) {
          avgQueueLength = (lambda * lambda) / (mu * (mu - lambda));
          avgWaitTime = lambda / (mu * (mu - lambda));
          avgResponseTime = 1 / (mu - lambda);
          p99WaitTime = avgWaitTime * 4.6;
        }
      } else {
        if (isStable) {
          avgQueueLength = (Math.pow(rho, c + 1) * c) / (1 - rho) / (Math.pow(c, 2) * Math.pow(1 - rho, 2));
          avgWaitTime = avgQueueLength / lambda;
          avgResponseTime = avgWaitTime + 1 / mu;
          p99WaitTime = avgWaitTime * 5;
        }
      }
      return {
        utilization: Math.round(rho * 1000) / 1000,
        avgQueueLength: Math.round(avgQueueLength * 100) / 100,
        avgWaitTime: Math.round(avgWaitTime * 10000) / 10000,
        avgResponseTime: Math.round(avgResponseTime * 10000) / 10000,
        p99WaitTime: Math.round(p99WaitTime * 10000) / 10000,
        isStable: isStable ? 'Yes' : 'No - system overloaded!',
      };
    },
    tags: ['latency', 'queueing', 'mm1', 'mmc', 'simulation'],
  },

  // ─── DATA & STORAGE ───────────────────────────────────────
  {
    id: 'database-sizing',
    name: 'Database Sizing Calculator',
    shortName: 'DB Sizing',
    description: 'Calculate database storage needs based on row size, row count, and replication',
    category: 'data',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '🗄️',
    color: 'text-green-400',
    inputs: [
      { key: 'rowSizeBytes', label: 'Avg Row Size (bytes)', type: 'number', defaultValue: 512, required: true },
      { key: 'rowCount', label: 'Total Rows', type: 'number', defaultValue: 1000000000, required: true },
      { key: 'replicationFactor', label: 'Replication Factor', type: 'number', defaultValue: 3, min: 1, max: 10 },
      { key: 'indexOverhead', label: 'Index Overhead (×)', type: 'number', defaultValue: 1.3, min: 1, max: 5, step: 0.1 },
      { key: 'growthRateYearly', label: 'Yearly Growth Rate (%)', type: 'number', defaultValue: 50, min: 0, max: 1000 },
    ],
    outputs: [
      { key: 'storageGB', label: 'Storage Required', type: 'number', unit: 'GB' },
      { key: 'storageTB', label: 'Storage (TB)', type: 'number', unit: 'TB' },
      { key: 'year1GB', label: 'Year 1 Storage', type: 'number', unit: 'GB' },
      { key: 'year2GB', label: 'Year 2 Storage', type: 'number', unit: 'GB' },
      { key: 'iopsNeeded', label: 'IOPS Needed', type: 'number', unit: 'IOPS' },
    ],
    compute: (inputs) => {
      const base = (inputs.rowSizeBytes as number) * (inputs.rowCount as number);
      const withIndex = base * (inputs.indexOverhead as number);
      const withReplication = withIndex * (inputs.replicationFactor as number);
      const storageGB = withReplication / 1e9;
      const storageTB = storageGB / 1000;
      const growth = (inputs.growthRateYearly as number) / 100;
      const year1GB = storageGB * (1 + growth);
      const year2GB = storageGB * Math.pow(1 + growth, 2);
      const iopsNeeded = Math.round((inputs.rowCount as number) * 0.001);
      return {
        storageGB: Math.round(storageGB * 100) / 100,
        storageTB: Math.round(storageTB * 1000) / 1000,
        year1GB: Math.round(year1GB * 100) / 100,
        year2GB: Math.round(year2GB * 100) / 100,
        iopsNeeded,
      };
    },
    tags: ['database', 'storage', 'replication', 'sizing', 'iops'],
  },
  {
    id: 'database-selection',
    name: 'Database Selection Tool',
    shortName: 'DB Selector',
    description: 'Choose the right database based on workload characteristics',
    category: 'data',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 5,
    icon: '🔍',
    color: 'text-green-400',
    inputs: [
      { key: 'dataModel', label: 'Data Model', type: 'select', required: true, options: [
        { value: 'relational', label: 'Relational (tables, joins)' },
        { value: 'document', label: 'Document (JSON, flexible schema)' },
        { value: 'keyvalue', label: 'Key-Value (simple lookups)' },
        { value: 'graph', label: 'Graph (relationships, traversals)' },
        { value: 'timeseries', label: 'Time-Series (metrics, events)' },
        { value: 'widecolumn', label: 'Wide-Column (sparse, large rows)' },
      ]},
      { key: 'consistency', label: 'Consistency Requirement', type: 'select', required: true, options: [
        { value: 'strong', label: 'Strong (ACID, transactions)' },
        { value: 'eventual', label: 'Eventual (high availability)' },
        { value: 'tunable', label: 'Tunable (per-operation)' },
      ]},
      { key: 'scale', label: 'Scale', type: 'select', required: true, options: [
        { value: 'small', label: 'Small (< 100GB, < 10K QPS)' },
        { value: 'medium', label: 'Medium (100GB-10TB, 10K-100K QPS)' },
        { value: 'large', label: 'Large (> 10TB, > 100K QPS)' },
      ]},
      { key: 'queries', label: 'Query Pattern', type: 'select', required: true, options: [
        { value: 'complex', label: 'Complex (joins, aggregations, ad-hoc)' },
        { value: 'simple', label: 'Simple (point lookups, range scans)' },
        { value: 'analytics', label: 'Analytics (OLAP, scans)' },
        { value: 'mixed', label: 'Mixed (OLTP + OLAP)' },
      ]},
    ],
    outputs: [
      { key: 'recommended', label: 'Recommended Database', type: 'text' },
      { key: 'alternatives', label: 'Alternatives', type: 'text' },
      { key: 'reasoning', label: 'Reasoning', type: 'text' },
    ],
    compute: (inputs) => {
      const model = inputs.dataModel as string;
      const consistency = inputs.consistency as string;
      const scale = inputs.scale as string;
      const queries = inputs.queries as string;

      // Decision logic
      let recommended = '';
      let alternatives = '';
      let reasoning = '';

      if (model === 'relational') {
        if (consistency === 'strong') {
          recommended = scale === 'large' ? 'CockroachDB / TiDB (distributed SQL)' : 'PostgreSQL';
          alternatives = 'MySQL, MariaDB, SQL Server';
          reasoning = 'Relational model with strong consistency needs ACID transactions. Distributed SQL for large scale.';
        } else {
          recommended = 'PostgreSQL (with async replication)';
          alternatives = 'MySQL, Aurora';
          reasoning = 'Relational model with relaxed consistency can use standard RDBMS with replication.';
        }
      } else if (model === 'document') {
        if (scale === 'large') {
          recommended = 'MongoDB (sharded)';
          alternatives = 'Couchbase, DynamoDB';
          reasoning = 'Document model with large scale needs horizontal sharding.';
        } else {
          recommended = 'MongoDB';
          alternatives = 'Couchbase, DocumentDB';
          reasoning = 'Document model fits MongoDB naturally at any scale.';
        }
      } else if (model === 'keyvalue') {
        recommended = scale === 'large' ? 'DynamoDB / Cassandra' : 'Redis / DynamoDB';
        alternatives = 'Redis, etcd, Consul';
        reasoning = 'Key-value access patterns benefit from specialized stores with O(1) lookups.';
      } else if (model === 'graph') {
        recommended = 'Neo4j';
        alternatives = 'Amazon Neptune, JanusGraph';
        reasoning = 'Graph traversals require native graph storage with index-free adjacency.';
      } else if (model === 'timeseries') {
        recommended = 'TimescaleDB / InfluxDB';
        alternatives = 'Prometheus, ClickHouse';
        reasoning = 'Time-series data needs compression, retention policies, and fast range queries.';
      } else if (model === 'widecolumn') {
        recommended = 'Cassandra / ScyllaDB';
        alternatives = 'HBase, Bigtable';
        reasoning = 'Wide-column model with sparse data needs column-family storage.';
      }

      // Adjust for query pattern
      if (queries === 'analytics') {
        recommended += ' (consider ClickHouse, Druid, or Snowflake for pure OLAP)';
      } else if (queries === 'mixed') {
        recommended += ' (consider HTAP: TiDB, SingleStore)';
      }

      return { recommended, alternatives, reasoning };
    },
    tags: ['database', 'selection', 'architecture', 'decision'],
  },
  {
    id: 'adr-builder',
    name: 'Architecture Decision Records',
    shortName: 'ADR Builder',
    description: 'Create and manage Architecture Decision Records with templates and trade-offs',
    category: 'architecture',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '📝',
    color: 'text-purple-400',
    inputs: [
      { key: 'title', label: 'Decision Title', type: 'text', defaultValue: '', required: true, placeholder: 'e.g., Choose message broker for event streaming' },
      { key: 'status', label: 'Status', type: 'select', defaultValue: 'proposed', options: [
        { value: 'proposed', label: 'Proposed' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'deprecated', label: 'Deprecated' },
        { value: 'superseded', label: 'Superseded' },
      ]},
      { key: 'context', label: 'Context', type: 'text', defaultValue: '', required: true, placeholder: 'What is the issue that motivates this decision?' },
      { key: 'options', label: 'Options Considered', type: 'text', defaultValue: '', placeholder: 'List alternatives with pros/cons' },
      { key: 'decision', label: 'Decision', type: 'text', defaultValue: '', required: true, placeholder: 'What was decided?' },
      { key: 'consequences', label: 'Consequences', type: 'text', defaultValue: '', placeholder: 'Trade-offs, risks, follow-up work' },
    ],
    outputs: [
      { key: 'adrMarkdown', label: 'Generated ADR (Markdown)', type: 'text' },
      { key: 'wordCount', label: 'Word Count', type: 'number' },
    ],
    compute: (inputs) => {
      const date = new Date().toISOString().split('T')[0];
      const adr = `# ADR: ${inputs.title || 'Untitled Decision'}\n\n**Status:** ${inputs.status}\n**Date:** ${date}\n\n## Context\n${inputs.context || 'No context provided.'}\n\n## Decision\n${inputs.decision || 'No decision recorded.'}\n\n## Options Considered\n${inputs.options || 'None listed.'}\n\n## Consequences\n${inputs.consequences || 'None listed.'}\n`;
      return {
        adrMarkdown: adr,
        wordCount: adr.split(/\s+/).filter(Boolean).length,
      };
    },
    tags: ['adr', 'architecture', 'decision', 'documentation'],
  },
  {
    id: 'api-design-builder',
    name: 'API Design Builder',
    shortName: 'API Builder',
    description: 'Design REST/GraphQL/gRPC APIs with OpenAPI/Swagger export',
    category: 'architecture',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '🔌',
    color: 'text-purple-400',
    inputs: [
      { key: 'apiType', label: 'API Type', type: 'select', defaultValue: 'rest', required: true, options: [
        { value: 'rest', label: 'REST' },
        { value: 'graphql', label: 'GraphQL' },
        { value: 'grpc', label: 'gRPC' },
      ]},
      { key: 'serviceName', label: 'Service Name', type: 'text', defaultValue: 'orders-api', required: true },
      { key: 'version', label: 'Version', type: 'text', defaultValue: 'v1' },
      { key: 'endpoints', label: 'Endpoints (JSON)', type: 'text', defaultValue: JSON.stringify([
        { method: 'GET', path: '/orders', description: 'List orders' },
        { method: 'POST', path: '/orders', description: 'Create order' },
        { method: 'GET', path: '/orders/{id}', description: 'Get order' },
      ], null, 2), placeholder: 'Array of {method, path, description}' },
    ],
    outputs: [
      { key: 'openapiYaml', label: 'OpenAPI Spec (YAML)', type: 'text' },
      { key: 'endpointCount', label: 'Endpoint Count', type: 'number' },
    ],
    compute: (inputs) => {
      let endpoints: any[] = [];
      try { endpoints = JSON.parse(inputs.endpoints as string || '[]'); } catch { endpoints = []; }
      const paths: Record<string, any> = {};
      endpoints.forEach((ep, i) => {
        const key = ep.path || `/endpoint${i}`;
        paths[key] = paths[key] || {};
        paths[key][(ep.method || 'get').toLowerCase()] = {
          summary: ep.description || key,
          responses: { '200': { description: 'Success' } },
        };
      });
      const openapi = {
        openapi: '3.0.3',
        info: { title: inputs.serviceName, version: inputs.version },
        paths,
      };
      return {
        openapiYaml: JSON.stringify(openapi, null, 2),
        endpointCount: endpoints.length,
      };
    },
    tags: ['api', 'rest', 'graphql', 'grpc', 'openapi', 'swagger'],
  },
  {
    id: 'message-queue-designer',
    name: 'Message Queue Designer',
    shortName: 'MQ Designer',
    description: 'Design message queue topologies and compare brokers',
    category: 'architecture',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '📨',
    color: 'text-purple-400',
    inputs: [
      { key: 'pattern', label: 'Messaging Pattern', type: 'select', defaultValue: 'pubsub', required: true, options: [
        { value: 'pubsub', label: 'Pub/Sub (broadcast)' },
        { value: 'queue', label: 'Work Queue (competing consumers)' },
        { value: 'stream', label: 'Event Stream (ordered, replayable)' },
        { value: 'deadletter', label: 'Dead Letter Queue' },
      ]},
      { key: 'throughput', label: 'Throughput (msg/sec)', type: 'number', defaultValue: 10000 },
      { key: 'latencyReq', label: 'Latency Requirement', type: 'select', defaultValue: 'low', options: [
        { value: 'realtime', label: 'Real-time (< 10ms)' },
        { value: 'low', label: 'Low (< 100ms)' },
        { value: 'batch', label: 'Batch (seconds-minutes)' },
      ]},
      { key: 'ordering', label: 'Ordering Required', type: 'checkbox', defaultValue: false },
      { key: 'retention', label: 'Retention Period', type: 'select', defaultValue: 'days', options: [
        { value: 'none', label: 'No retention (fire & forget)' },
        { value: 'hours', label: 'Hours' },
        { value: 'days', label: 'Days' },
        { value: 'weeks', label: 'Weeks' },
        { value: 'months', label: 'Months/Years' },
      ]},
    ],
    outputs: [
      { key: 'recommendedBroker', label: 'Recommended Broker', type: 'text' },
      { key: 'topologyDiagram', label: 'Topology (Mermaid)', type: 'text' },
      { key: 'alternatives', label: 'Alternative Brokers', type: 'text' },
    ],
    compute: (inputs) => {
      const pattern = inputs.pattern as string;
      const throughput = inputs.throughput as number;
      const latency = inputs.latencyReq as string;
      const ordering = inputs.ordering as boolean;
      const retention = inputs.retention as string;

      let recommended = '';
      let alternatives = '';
      let topology = '';

      if (pattern === 'pubsub') {
        if (throughput > 100000) {
          recommended = 'Apache Pulsar / Kafka';
          alternatives = 'NATS JetStream, Redpanda';
        } else if (throughput > 10000) {
          recommended = 'Kafka / RabbitMQ (with plugins)';
          alternatives = 'Pulsar, NATS';
        } else {
          recommended = 'RabbitMQ / NATS';
          alternatives = 'Redis Pub/Sub, Google Pub/Sub';
        }
        topology = `graph LR\n  P[Publisher] --> T[Topic/Exchange]\n  T --> S1[Subscriber 1]\n  T --> S2[Subscriber 2]\n  T --> S3[Subscriber 3]`;
      } else if (pattern === 'queue') {
        if (ordering) {
          recommended = 'Kafka / SQS FIFO';
          alternatives = 'RabbitMQ (single consumer), Pulsar';
        } else {
          recommended = 'RabbitMQ / SQS / Redis Streams';
          alternatives = 'Kafka, NATS JetStream';
        }
        topology = `graph LR\n  P[Producer] --> Q[Queue]\n  Q --> C1[Consumer 1]\n  Q --> C2[Consumer 2]\n  Q --> C3[Consumer 3]`;
      } else if (pattern === 'stream') {
        if (retention === 'months' || retention === 'weeks') {
          recommended = 'Kafka / Pulsar / Redpanda';
          alternatives = 'EventStoreDB, NATS JetStream';
        } else {
          recommended = 'Kafka / Redis Streams';
          alternatives = 'Pulsar, NATS JetStream';
        }
        topology = `graph LR\n  P[Producer] --> S[Stream/Log]\n  S --> CG1[Consumer Group A]\n  S --> CG2[Consumer Group B]`;
      } else {
        recommended = 'RabbitMQ / SQS (with DLQ)';
        alternatives = 'Kafka (with dead letter topic)';
        topology = `graph LR\n  P[Producer] --> Q[Main Queue]\n  Q -->|failed| DLQ[Dead Letter Queue]\n  Q --> C[Consumer]`;
      }

      if (latency === 'realtime' && !recommended.includes('NATS')) {
        alternatives = 'NATS, ' + alternatives;
      }

      return { recommendedBroker: recommended, topologyDiagram: topology, alternatives };
    },
    tags: ['messaging', 'queue', 'pubsub', 'kafka', 'rabbitmq', 'architecture'],
  },
  {
    id: 'scalability-planner',
    name: 'Scalability Planning Tool',
    shortName: 'Scalability',
    description: 'Identify bottlenecks and plan horizontal/vertical scaling strategies',
    category: 'architecture',
    difficulty: 'advanced',
    estimatedTimeMinutes: 20,
    icon: '📈',
    color: 'text-purple-400',
    inputs: [
      { key: 'currentQps', label: 'Current QPS', type: 'number', defaultValue: 1000, required: true },
      { key: 'targetQps', label: 'Target QPS', type: 'number', defaultValue: 10000, required: true },
      { key: 'cpuUtil', label: 'Current CPU Utilization (%)', type: 'number', defaultValue: 60, min: 0, max: 100 },
      { key: 'memUtil', label: 'Current Memory Utilization (%)', type: 'number', defaultValue: 50, min: 0, max: 100 },
      { key: 'dbUtil', label: 'Database Utilization (%)', type: 'number', defaultValue: 40, min: 0, max: 100 },
      { key: 'stateless', label: 'Service is Stateless', type: 'checkbox', defaultValue: true },
    ],
    outputs: [
      { key: 'scaleFactor', label: 'Scale Factor', type: 'number' },
      { key: 'horizontalInstances', label: 'Horizontal Instances Needed', type: 'number' },
      { key: 'bottleneck', label: 'Primary Bottleneck', type: 'text' },
      { key: 'strategy', label: 'Recommended Strategy', type: 'text' },
      { key: 'verticalNeeded', label: 'Vertical Scaling Needed', type: 'text' },
    ],
    compute: (inputs) => {
      const scaleFactor = (inputs.targetQps as number) / (inputs.currentQps as number);
      const cpuHeadroom = 100 - (inputs.cpuUtil as number);
      const memHeadroom = 100 - (inputs.memUtil as number);
      const dbHeadroom = 100 - (inputs.dbUtil as number);

      let bottleneck = '';
      let strategy = '';
      let verticalNeeded = 'No';
      let horizontalInstances = 1;

      if (dbHeadroom < 30) {
        bottleneck = 'Database';
        strategy = 'Read replicas, sharding, caching, or move to distributed SQL';
        verticalNeeded = 'Consider larger DB instance';
      } else if (cpuHeadroom < 30) {
        bottleneck = 'CPU';
        strategy = inputs.stateless ? 'Horizontal scaling (add instances)' : 'Vertical scaling or refactor for statelessness';
        horizontalInstances = Math.ceil(scaleFactor * (inputs.cpuUtil as number) / 70);
      } else if (memHeadroom < 30) {
        bottleneck = 'Memory';
        strategy = 'Vertical scaling or optimize memory usage (caching, connection pooling)';
        verticalNeeded = 'Larger instance with more RAM';
      } else {
        bottleneck = 'Network / Other';
        strategy = 'Horizontal scaling likely sufficient';
        horizontalInstances = Math.ceil(scaleFactor);
      }

      if (inputs.stateless && bottleneck !== 'Database') {
        horizontalInstances = Math.max(horizontalInstances, Math.ceil(scaleFactor * 0.8));
      }

      return {
        scaleFactor: Math.round(scaleFactor * 100) / 100,
        horizontalInstances,
        bottleneck,
        strategy,
        verticalNeeded,
      };
    },
    tags: ['scalability', 'bottleneck', 'horizontal-scaling', 'vertical-scaling', 'architecture'],
  },
  {
    id: 'cache-simulator',
    name: 'Cache Strategy Simulator',
    shortName: 'Cache Sim',
    description: 'Simulate cache hit rates and eviction policies with workload traces',
    category: 'performance',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '💾',
    color: 'text-yellow-400',
    inputs: [
      { key: 'cacheSize', label: 'Cache Size (MB)', type: 'number', defaultValue: 100, required: true },
      { key: 'itemSizeKB', label: 'Avg Item Size (KB)', type: 'number', defaultValue: 10, required: true },
      { key: 'workloadType', label: 'Workload Pattern', type: 'select', defaultValue: 'zipf', required: true, options: [
        { value: 'uniform', label: 'Uniform (random)' },
        { value: 'zipf', label: 'Zipfian (80/20)' },
        { value: 'sequential', label: 'Sequential' },
        { value: 'looping', label: 'Looping (small hot set)' },
      ]},
      { key: 'zipfParam', label: 'Zipf Parameter (s)', type: 'number', defaultValue: 1.0, min: 0.5, max: 2.0, step: 0.1 },
      { key: 'evictionPolicy', label: 'Eviction Policy', type: 'select', defaultValue: 'lru', required: true, options: [
        { value: 'lru', label: 'LRU (Least Recently Used)' },
        { value: 'lfu', label: 'LFU (Least Frequently Used)' },
        { value: 'fifo', label: 'FIFO (First In First Out)' },
        { value: 'random', label: 'Random' },
      ]},
      { key: 'requests', label: 'Total Requests', type: 'number', defaultValue: 100000, min: 1000, max: 10000000 },
    ],
    outputs: [
      { key: 'hitRate', label: 'Hit Rate', type: 'number', unit: '%' },
      { key: 'missRate', label: 'Miss Rate', type: 'number', unit: '%' },
      { key: 'capacityItems', label: 'Max Items in Cache', type: 'number' },
      { key: 'hotSetSize', label: 'Estimated Hot Set Size', type: 'number' },
      { key: 'recommendation', label: 'Recommendation', type: 'text' },
    ],
    compute: (inputs) => {
      const cacheSize = (inputs.cacheSize as number) * 1024; // KB
      const itemSize = inputs.itemSizeKB as number;
      const capacity = Math.floor(cacheSize / itemSize);
      const workload = inputs.workloadType as string;
      const s = inputs.zipfParam as number;

      // Simple hit rate estimation based on workload and capacity
      let hitRate = 0;
      const hotSetEstimate = Math.floor(capacity * 0.2); // rough estimate

      if (workload === 'uniform') {
        hitRate = Math.min(capacity / 1000, 0.99) * 100;
      } else if (workload === 'zipf') {
        // Zipf: top items get most requests
        // Hit rate roughly = capacity^(1-s) for Zipf
        const alpha = 1 - s;
        if (alpha > 0) {
          hitRate = Math.min(100 * Math.pow(capacity / 10000, alpha) * 20, 99);
        } else {
          hitRate = Math.min(99, 10 + capacity * 0.05);
        }
      } else if (workload === 'sequential') {
        hitRate = capacity > 1000 ? 5 : 0; // very poor for sequential
      } else if (workload === 'looping') {
        hitRate = capacity > 100 ? 95 : 50;
      }

      // Policy adjustments
      if (inputs.evictionPolicy === 'lfu') hitRate *= 1.05;
      else if (inputs.evictionPolicy === 'fifo') hitRate *= 0.95;
      else if (inputs.evictionPolicy === 'random') hitRate *= 0.9;

      hitRate = Math.min(99, Math.max(0, hitRate));

      let recommendation = '';
      if (hitRate < 50) recommendation = 'Increase cache size or use tiered caching';
      else if (hitRate < 80) recommendation = 'Consider larger cache or better eviction policy';
      else if (hitRate < 95) recommendation = 'Good hit rate; monitor for changes';
      else recommendation = 'Excellent hit rate';

      return {
        hitRate: Math.round(hitRate * 100) / 100,
        missRate: Math.round((100 - hitRate) * 100) / 100,
        capacityItems: capacity,
        hotSetSize: hotSetEstimate,
        recommendation,
      };
    },
    tags: ['cache', 'simulation', 'lru', 'lfu', 'zipf', 'performance'],
  },
  {
    id: 'load-balancer-visualizer',
    name: 'Load Balancer Visualizer',
    shortName: 'LB Visualizer',
    description: 'Compare load balancing algorithms with visual request distribution',
    category: 'performance',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 10,
    icon: '⚖️',
    color: 'text-yellow-400',
    inputs: [
      { key: 'algorithm', label: 'Algorithm', type: 'select', defaultValue: 'roundrobin', required: true, options: [
        { value: 'roundrobin', label: 'Round Robin' },
        { value: 'leastconn', label: 'Least Connections' },
        { value: 'iphash', label: 'IP Hash' },
        { value: 'consistent', label: 'Consistent Hash' },
        { value: 'weighted', label: 'Weighted Round Robin' },
      ]},
      { key: 'servers', label: 'Number of Servers', type: 'number', defaultValue: 4, min: 2, max: 20 },
      { key: 'requests', label: 'Total Requests', type: 'number', defaultValue: 100, min: 10, max: 10000 },
      { key: 'weights', label: 'Server Weights (comma-separated)', type: 'text', defaultValue: '1,1,1,1', placeholder: 'e.g., 2,1,3,1' },
      { key: 'ipVariance', label: 'Client IP Diversity', type: 'select', defaultValue: 'high', options: [
        { value: 'low', label: 'Low (few unique IPs)' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High (many unique IPs)' },
      ]},
    ],
    outputs: [
      { key: 'distribution', label: 'Request Distribution', type: 'text' },
      { key: 'variance', label: 'Load Variance', type: 'number' },
      { key: 'fairnessScore', label: 'Fairness Score (0-100)', type: 'number' },
      { key: 'visualization', label: 'Distribution Bar Chart', type: 'text' },
    ],
    compute: (inputs) => {
      const algorithm = inputs.algorithm as string;
      const serverCount = inputs.servers as number;
      const totalRequests = inputs.requests as number;
      const weights = (inputs.weights as string).split(',').map(Number).filter(n => !isNaN(n));
      const ipVariance = inputs.ipVariance as string;

      // Simulate distribution
      const counts = new Array(serverCount).fill(0);

      if (algorithm === 'roundrobin') {
        for (let i = 0; i < totalRequests; i++) {
          counts[i % serverCount]++;
        }
      } else if (algorithm === 'leastconn') {
        for (let i = 0; i < totalRequests; i++) {
          const min = Math.min(...counts);
          const idx = counts.indexOf(min);
          counts[idx]++;
        }
      } else if (algorithm === 'iphash') {
        const uniqueIPs = ipVariance === 'high' ? 1000 : ipVariance === 'medium' ? 100 : 10;
        for (let i = 0; i < totalRequests; i++) {
          const ip = i % uniqueIPs;
          const idx = ip % serverCount;
          counts[idx]++;
        }
      } else if (algorithm === 'consistent') {
        for (let i = 0; i < totalRequests; i++) {
          // Simplified consistent hashing
          const hash = ((i * 1103515245 + 12345) >>> 0) % serverCount;
          counts[hash]++;
        }
      } else if (algorithm === 'weighted') {
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const targetCounts = weights.map(w => Math.round((w / totalWeight) * totalRequests));
        let remaining = totalRequests - targetCounts.reduce((a, b) => a + b, 0);
        for (let i = 0; i < serverCount && remaining > 0; i++) {
          targetCounts[i]++;
          remaining--;
        }
        for (let i = 0; i < serverCount; i++) {
          counts[i] = targetCounts[i];
        }
      }

      const avg = totalRequests / serverCount;
      const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / serverCount;
      const fairnessScore = Math.max(0, 100 - (variance / avg) * 100);

      // Visualization bar chart
      const maxCount = Math.max(...counts);
      const bars = counts.map((c, i) => {
        const barLen = Math.round((c / maxCount) * 30);
        return `S${i + 1}: ${'█'.repeat(barLen)} ${c}`;
      }).join('\n');

      return {
        distribution: counts.join(', '),
        variance: Math.round(variance * 100) / 100,
        fairnessScore: Math.round(fairnessScore * 100) / 100,
        visualization: bars,
      };
    },
    tags: ['load-balancer', 'round-robin', 'least-connections', 'consistent-hash', 'visualization'],
  },
  {
    id: 'rate-limit-tester',
    name: 'Rate Limit Tester',
    shortName: 'Rate Limit',
    description: 'Test and visualize token bucket, leaky bucket, and sliding window algorithms',
    category: 'reliability',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 10,
    icon: '🚦',
    color: 'text-red-400',
    inputs: [
      { key: 'algorithm', label: 'Algorithm', type: 'select', defaultValue: 'tokenbucket', required: true, options: [
        { value: 'tokenbucket', label: 'Token Bucket' },
        { value: 'leakybucket', label: 'Leaky Bucket' },
        { value: 'slidingwindow', label: 'Sliding Window' },
        { value: 'fixedwindow', label: 'Fixed Window' },
      ]},
      { key: 'rate', label: 'Rate Limit (req/sec)', type: 'number', defaultValue: 10, required: true },
      { key: 'burst', label: 'Burst Capacity (tokens/bucket size)', type: 'number', defaultValue: 20 },
      { key: 'pattern', label: 'Traffic Pattern', type: 'select', defaultValue: 'steady', options: [
        { value: 'steady', label: 'Steady (constant rate)' },
        { value: 'bursty', label: 'Bursty (periodic spikes)' },
        { value: 'ramp', label: 'Ramp Up (gradual increase)' },
      ]},
      { key: 'duration', label: 'Test Duration (seconds)', type: 'number', defaultValue: 30, min: 1, max: 300 },
    ],
    outputs: [
      { key: 'allowed', label: 'Requests Allowed', type: 'number' },
      { key: 'rejected', label: 'Requests Rejected', type: 'number' },
      { key: 'rejectionRate', label: 'Rejection Rate', type: 'number', unit: '%' },
      { key: 'timeline', label: 'Timeline (allowed/rejected per sec)', type: 'text' },
    ],
    compute: (inputs) => {
      const algorithm = inputs.algorithm as string;
      const rate = inputs.rate as number;
      const burst = inputs.burst as number;
      const pattern = inputs.pattern as string;
      const duration = inputs.duration as number;

      let tokens = burst;
      let allowed = 0;
      let rejected = 0;
      const timeline: string[] = [];

      for (let t = 0; t < duration; t++) {
        let reqThisSec = 0;
        if (pattern === 'steady') reqThisSec = rate * 1.5;
        else if (pattern === 'bursty') reqThisSec = (t % 5 === 0) ? rate * 5 : rate * 0.5;
        else if (pattern === 'ramp') reqThisSec = Math.floor(rate * 1.5 * (t / duration));
        reqThisSec = Math.max(1, Math.round(reqThisSec));

        let secAllowed = 0;
        let secRejected = 0;

        for (let r = 0; r < reqThisSec; r++) {
          let pass = false;
          if (algorithm === 'tokenbucket') {
            if (tokens >= 1) { tokens--; pass = true; }
          } else if (algorithm === 'leakybucket') {
            // Leaky bucket: process at fixed rate, queue up to burst
            if (tokens < burst) { tokens++; pass = true; }
          } else if (algorithm === 'slidingwindow') {
            // Simplified: similar to token bucket for this sim
            if (tokens >= 1) { tokens--; pass = true; }
          } else if (algorithm === 'fixedwindow') {
            if (tokens >= 1) { tokens--; pass = true; }
          }
          if (pass) { allowed++; secAllowed++; } else { rejected++; secRejected++; }
        }

        // Refill tokens
        if (algorithm === 'tokenbucket') {
          tokens = Math.min(burst, tokens + rate);
        } else if (algorithm === 'leakybucket') {
          tokens = Math.max(0, tokens - rate);
        } else if (algorithm === 'slidingwindow') {
          tokens = Math.min(burst, tokens + rate);
        } else if (algorithm === 'fixedwindow') {
          if (t % 1 === 0) tokens = burst;
        }

        timeline.push(`${t}s: ✓${secAllowed} ✗${secRejected}`);
      }

      return {
        allowed,
        rejected,
        rejectionRate: Math.round((rejected / (allowed + rejected || 1)) * 10000) / 100,
        timeline: timeline.join('\n'),
      };
    },
    tags: ['rate-limit', 'token-bucket', 'leaky-bucket', 'sliding-window', 'api-gateway'],
  },
  {
    id: 'circuit-breaker-simulator',
    name: 'Circuit Breaker Simulator',
    shortName: 'Circuit Breaker',
    description: 'Simulate circuit breaker state machine with failure injection',
    category: 'reliability',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 10,
    icon: '🔌',
    color: 'text-red-400',
    inputs: [
      { key: 'failureRate', label: 'Failure Rate (%)', type: 'number', defaultValue: 30, min: 0, max: 100 },
      { key: 'threshold', label: 'Failure Threshold (%)', type: 'number', defaultValue: 50, min: 1, max: 100 },
      { key: 'windowSize', label: 'Window Size (requests)', type: 'number', defaultValue: 10, min: 5, max: 100 },
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number', defaultValue: 30, min: 1, max: 300 },
      { key: 'totalRequests', label: 'Total Requests', type: 'number', defaultValue: 100, min: 10, max: 1000 },
    ],
    outputs: [
      { key: 'stateTimeline', label: 'State Timeline', type: 'text' },
      { key: 'successRate', label: 'Overall Success Rate', type: 'number', unit: '%' },
      { key: 'trippedCount', label: 'Times Tripped', type: 'number' },
      { key: 'finalState', label: 'Final State', type: 'text' },
    ],
    compute: (inputs) => {
      const failureRate = (inputs.failureRate as number) / 100;
      const threshold = (inputs.threshold as number) / 100;
      const windowSize = inputs.windowSize as number;
      const timeout = inputs.timeout as number;
      const totalRequests = inputs.totalRequests as number;

      let state = 'CLOSED';
      let failureCount = 0;
      let requestCount = 0;
      let trippedCount = 0;
      let timeInOpen = 0;
      const timeline: string[] = [];
      let successCount = 0;

      for (let i = 0; i < totalRequests; i++) {
        const isFailure = Math.random() < failureRate;

        if (state === 'OPEN') {
          timeInOpen++;
          if (timeInOpen >= timeout) {
            state = 'HALF_OPEN';
            timeInOpen = 0;
          }
          timeline.push(`Req ${i + 1}: ${state} (rejected)`);
          continue;
        }

        requestCount++;
        if (isFailure) {
          failureCount++;
        } else {
          successCount++;
        }

        // Check threshold
        const currentRate = failureCount / requestCount;
        if (state === 'CLOSED' && currentRate >= threshold && requestCount >= windowSize) {
          state = 'OPEN';
          trippedCount++;
          failureCount = 0;
          requestCount = 0;
          timeline.push(`Req ${i + 1}: ${state} (tripped!)`);
          continue;
        }

        if (state === 'HALF_OPEN') {
          if (!isFailure) {
            state = 'CLOSED';
            failureCount = 0;
            requestCount = 0;
            timeline.push(`Req ${i + 1}: ${state} (recovered)`);
          } else {
            state = 'OPEN';
            trippedCount++;
            timeInOpen = 0;
            timeline.push(`Req ${i + 1}: ${state} (re-tripped)`);
          }
          continue;
        }

        timeline.push(`Req ${i + 1}: ${state} (${isFailure ? 'fail' : 'ok'})`);
      }

      return {
        stateTimeline: timeline.join('\n'),
        successRate: Math.round((successCount / totalRequests) * 10000) / 100,
        trippedCount,
        finalState: state,
      };
    },
    tags: ['circuit-breaker', 'resilience', 'fault-tolerance', 'state-machine', 'hystrix'],
  },
  {
    id: 'sharding-visualizer',
    name: 'Database Sharding Visualizer',
    shortName: 'Sharding',
    description: 'Visualize shard key distribution and rebalancing across shards',
    category: 'data',
    difficulty: 'advanced',
    estimatedTimeMinutes: 10,
    icon: '🔪',
    color: 'text-green-400',
    inputs: [
      { key: 'shards', label: 'Number of Shards', type: 'number', defaultValue: 4, min: 2, max: 64 },
      { key: 'keys', label: 'Number of Keys', type: 'number', defaultValue: 1000, min: 100, max: 100000 },
      { key: 'keyDistribution', label: 'Key Distribution', type: 'select', defaultValue: 'uniform', options: [
        { value: 'uniform', label: 'Uniform' },
        { value: 'zipfian', label: 'Zipfian (hot keys)' },
        { value: 'sequential', label: 'Sequential (time-series)' },
        { value: 'user_id', label: 'User ID (realistic)' },
      ]},
      { key: 'algorithm', label: 'Sharding Algorithm', type: 'select', defaultValue: 'hash', options: [
        { value: 'hash', label: 'Hash-based' },
        { value: 'range', label: 'Range-based' },
        { value: 'consistent', label: 'Consistent Hash' },
      ]},
    ],
    outputs: [
      { key: 'distribution', label: 'Keys per Shard', type: 'text' },
      { key: 'imbalance', label: 'Imbalance Ratio (max/avg)', type: 'number' },
      { key: 'hotShards', label: 'Hot Shards (>2x avg)', type: 'number' },
      { key: 'visualization', label: 'Shard Distribution', type: 'text' },
    ],
    compute: (inputs) => {
      const shardCount = inputs.shards as number;
      const keyCount = inputs.keys as number;
      const distribution = inputs.keyDistribution as string;
      const algorithm = inputs.algorithm as string;

      const shardCounts = new Array(shardCount).fill(0);

      for (let i = 0; i < keyCount; i++) {
        let key: number;
        if (distribution === 'uniform') {
          key = Math.random();
        } else if (distribution === 'zipfian') {
          key = Math.pow(Math.random(), 1.2);
        } else if (distribution === 'sequential') {
          key = i / keyCount;
        } else if (distribution === 'user_id') {
          key = Math.random() < 0.8 ? Math.random() * 0.2 : Math.random() * 0.8 + 0.2;
        } else {
          key = Math.random();
        }

        let shardIdx = 0;
        if (algorithm === 'hash') {
          shardIdx = Math.floor(key * shardCount) % shardCount;
        } else if (algorithm === 'range') {
          shardIdx = Math.floor(key * shardCount);
        } else if (algorithm === 'consistent') {
          // Simplified consistent hash
          const hash = Math.floor(key * 1000000);
          shardIdx = hash % shardCount;
        }
        shardIdx = Math.max(0, Math.min(shardCount - 1, shardIdx));
        shardCounts[shardIdx]++;
      }

      const avg = keyCount / shardCount;
      const max = Math.max(...shardCounts);
      const imbalance = max / avg;
      const hotShards = shardCounts.filter(c => c > avg * 2).length;

      const maxCount = Math.max(...shardCounts);
      const bars = shardCounts.map((c, i) => {
        const barLen = Math.round((c / maxCount) * 40);
        return `Shard ${i}: ${'█'.repeat(barLen)} ${c}`;
      }).join('\n');

      return {
        distribution: shardCounts.join(', '),
        imbalance: Math.round(imbalance * 100) / 100,
        hotShards,
        visualization: bars,
      };
    },
    tags: ['sharding', 'database', 'partitioning', 'consistent-hash', 'distribution'],
  },
  {
    id: 'consistency-model-explorer',
    name: 'Consistency Model Explorer',
    shortName: 'Consistency',
    description: 'Explore consistency models from linearizable to eventual with anomaly visualization',
    category: 'architecture',
    difficulty: 'advanced',
    estimatedTimeMinutes: 15,
    icon: '🔍',
    color: 'text-purple-400',
    inputs: [
      { key: 'model', label: 'Consistency Model', type: 'select', defaultValue: 'eventual', required: true, options: [
        { value: 'linearizable', label: 'Linearizable (strict)' },
        { value: 'sequential', label: 'Sequential' },
        { value: 'causal', label: 'Causal' },
        { value: 'readYourWrites', label: 'Read Your Writes' },
        { value: 'monotonicReads', label: 'Monotonic Reads' },
        { value: 'eventual', label: 'Eventual' },
      ]},
      { key: 'replicas', label: 'Number of Replicas', type: 'number', defaultValue: 3, min: 2, max: 10 },
      { key: 'networkDelay', label: 'Network Delay (ms)', type: 'number', defaultValue: 100, min: 1, max: 10000 },
      { key: 'partition', label: 'Network Partition?', type: 'checkbox', defaultValue: false },
      { key: 'ops', label: 'Operations to Simulate', type: 'number', defaultValue: 20, min: 5, max: 100 },
    ],
    outputs: [
      { key: 'timeline', label: 'Operation Timeline', type: 'text' },
      { key: 'anomalies', label: 'Anomalies Detected', type: 'text' },
      { key: 'staleReads', label: 'Stale Reads', type: 'number' },
      { key: 'writeConflicts', label: 'Write Conflicts', type: 'number' },
      { key: 'consistencyViolations', label: 'Consistency Violations', type: 'number' },
      { key: 'modelDescription', label: 'Model Description', type: 'text' },
    ],
    compute: (inputs) => {
      const model = inputs.model as string;
      const replicas = inputs.replicas as number;
      const delay = inputs.networkDelay as number;
      const partitioned = inputs.partition as boolean;
      const opsCount = inputs.ops as number;

      const timeline: string[] = [];
      let staleReads = 0;
      let writeConflicts = 0;
      let consistencyViolations = 0;
      const replicaVersions = new Array(replicas).fill(0);
      const buildOrder: number[] = [];

      const propagateToAll = partitioned 
        ? (idx: number) => replicaVersions[Math.min(idx + 1, replicas - 1)] = replicaVersions[idx]
        : () => {}; // full sync is instant for non-partitioned

      for (let i = 0; i < opsCount; i++) {
        const isWrite = Math.random() < 0.5;
        const replica = Math.floor(Math.random() * replicas);

        if (isWrite) {
          replicaVersions[replica]++;
          buildOrder.push(replica);
          const propagationDelay = partitioned ? delay * 3 : delay;
          timeline.push(`T${i}: WRITE on R${replica} (v${replicaVersions[replica]}, propagation: ${propagationDelay}ms)`);
          writeConflicts += partitioned && replicaVersions.some(v => v !== replicaVersions[replica]) ? 1 : 0;
        } else {
          const currentVersion = replicaVersions[replica];
          const latestVersion = Math.max(...replicaVersions);
          
          if (model === 'linearizable') {
            consistencyViolations += currentVersion < latestVersion ? 1 : 0;
          } else if (model === 'sequential') {
            consistencyViolations += currentVersion < latestVersion - 1 ? 1 : 0;
          } else if (model === 'readYourWrites') {
            const lastWriteReplica = buildOrder.filter(r => r === replica).length;
            consistencyViolations += currentVersion < lastWriteReplica ? 1 : 0;
          } else if (model === 'causal') {
            consistencyViolations += currentVersion < latestVersion - 2 ? 1 : 0;
          } else if (model === 'monotonicReads') {
            consistencyViolations += currentVersion > 0 && Math.random() < 0.3 ? 1 : 0;
          }

          staleReads += currentVersion < latestVersion ? 1 : 0;
          timeline.push(`T${i}: READ  on R${replica} (got v${currentVersion}, latest v${latestVersion})`);
        }
      }

      const descriptions: Record<string, string> = {
        linearizable: 'Strongest: every operation appears to execute atomically at a single point in time. All replicas agree on order.',
        sequential: 'All operations appear in a single total order, but actual execution points may differ across replicas.',
        causal: 'Causally-related operations are seen in order; concurrent operations may appear in any order across replicas.',
        readYourWrites: 'A client always reads its own writes, but may see stale data from other clients.',
        monotonicReads: 'A client never sees a version older than one it has already seen.',
        eventual: 'Weakest: replicas eventually converge to the same state if no new writes occur. Stale reads are common.',
      };

      const anomalies = [];
      if (staleReads > 0) anomalies.push('stale reads');
      if (writeConflicts > 0) anomalies.push('write conflicts');
      if (consistencyViolations > 0) anomalies.push('consistency violations');

      return {
        timeline: timeline.join('\n'),
        anomalies: anomalies.join(', ') || 'none',
        staleReads,
        writeConflicts,
        consistencyViolations,
        modelDescription: descriptions[model] || '',
      };
    },
    tags: ['consistency', 'linearizable', 'eventual', 'causal', 'cap', 'distributed-systems'],
  },
  {
    id: 'microservices-decomposer',
    name: 'Microservices Decomposer',
    shortName: 'Microservices',
    description: 'Decompose a monolith using domain-driven design with bounded contexts and service boundaries',
    category: 'architecture',
    difficulty: 'advanced',
    estimatedTimeMinutes: 20,
    icon: '🧩',
    color: 'text-purple-400',
    inputs: [
      { key: 'domain', label: 'Domain (e.g., e-commerce, banking)', type: 'select', defaultValue: 'ecommerce', required: true, options: [
        { value: 'ecommerce', label: 'E-Commerce' },
        { value: 'banking', label: 'Banking / Fintech' },
        { value: 'social', label: 'Social Media' },
        { value: 'logistics', label: 'Logistics / Delivery' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'streaming', label: 'Video Streaming' },
      ]},
      { key: 'decompositionStyle', label: 'Decomposition Approach', type: 'select', defaultValue: 'boundedContext', required: true, options: [
        { value: 'boundedContext', label: 'By Bounded Context (DDD)' },
        { value: 'businessCapability', label: 'By Business Capability' },
        { value: 'subdomain', label: 'By Subdomain' },
      ]},
      { key: 'teamSize', label: 'Team Size (Two-Pizza Teams)', type: 'number', defaultValue: 6, min: 3, max: 15 },
      { key: 'includeDataStores', label: 'Database per Service', type: 'checkbox', defaultValue: true },
    ],
    outputs: [
      { key: 'services', label: 'Proposed Services', type: 'text' },
      { key: 'serviceCount', label: 'Total Services', type: 'number' },
      { key: 'boundedContexts', label: 'Bounded Contexts', type: 'text' },
      { key: 'communicationMap', label: 'Communication Patterns', type: 'text' },
      { key: 'antiPatterns', label: 'Anti-Patterns to Avoid', type: 'text' },
    ],
    compute: (inputs) => {
      const domain = inputs.domain as string;
      const style = inputs.decompositionStyle as string;

      const domainServices: Record<string, { services: string[]; contexts: string[]; comms: string[]; anti: string[] }> = {
        ecommerce: {
          services: ['Product Catalog', 'Order Management', 'Payment Service', 'Inventory', 'Shipping', 'User Auth', 'Notification', 'Recommendation Engine'],
          contexts: ['Catalog Context', 'Order Context', 'Payment Context', 'Fulfillment Context', 'Customer Context'],
          comms: ['Order → Payment: async (events)', 'Order → Inventory: sync (reserve stock)', 'Order → Shipping: async (events)', 'Catalog → Recommendation: async (data feed)'],
          anti: ['Don\'t create a "shared data" service', 'Avoid distributed transactions across Order+Payment', 'Don\'t split Product Catalog too fine-grained'],
        },
        banking: {
          services: ['Account Management', 'Transaction Processing', 'Fraud Detection', 'Loan Origination', 'Customer Onboarding', 'Reporting & Analytics', 'Compliance Engine'],
          contexts: ['Core Banking', 'Risk & Compliance', 'Customer Management', 'Product (Loans/Accounts)', 'Regulatory Reporting'],
          comms: ['Transaction → Fraud: async (events)', 'Transaction → Accounts: sync (balance check)', 'Loan → Compliance: async (audit trail)'],
          anti: ['Don\'t expose raw transactions across services', 'Avoid sync calls for non-critical flows', 'Keep regulatory data in isolated context'],
        },
        social: {
          services: ['User Profile', 'Feed Service', 'Post/Content Service', 'Notification', 'Messaging', 'Search', 'Analytics', 'Media Storage'],
          contexts: ['User Context', 'Content Context', 'Social Graph Context', 'Engagement Context', 'Media Context'],
          comms: ['Post → Feed: async (fan-out)', 'User → Messaging: sync', 'Content → Search: async (indexing)'],
          anti: ['Don\'t make Feed pull from User+Post directly', 'Avoid tight coupling between Post and Notification', 'Don\'t share DB between Feed and Content'],
        },
        logistics: {
          services: ['Order Intake', 'Route Optimization', 'Driver Management', 'Tracking', 'Warehouse', 'Pricing Engine'],
          contexts: ['Dispatch Context', 'Inventory Context', 'Pricing Context', 'Driver Context'],
          comms: ['Order → Route: async (batch)', 'Route → Driver: sync (assignment)', 'Tracking → Order: async (status updates)'],
          anti: ['Don\'t couple Route Optimization to single warehouse', 'Avoid real-time sync for non-critical updates'],
        },
        healthcare: {
          services: ['Patient Records', 'Appointment Scheduling', 'Billing', 'Lab Results', 'Prescription', 'Insurance Verification'],
          contexts: ['Clinical Context', 'Administrative Context', 'Billing Context', 'Pharmacy Context'],
          comms: ['Patient → Lab: async (results)', 'Appointment → Billing: async (claims)', 'Prescription → Pharmacy: async (orders)'],
          anti: ['Don\'t share raw PHI across contexts without transformation', 'Avoid sync calls for HIPAA-sensitive data', 'Keep audit logs per context'],
        },
        streaming: {
          services: ['Content Catalog', 'Video Ingestion', 'Transcoding Pipeline', 'Player Service', 'Recommendation', 'User Management', 'CDN Edge', 'Analytics'],
          contexts: ['Content Context', 'Playback Context', 'Personalization Context', 'Delivery Context'],
          comms: ['Ingestion → Transcoding: async (jobs)', 'Transcoding → CDN: async (distribution)', 'Player → Recommendation: async (events)'],
          anti: ['Don\'t couple Player to Transcoding directly', 'Avoid sync recommendations in playback path'],
        },
      };

      const ds = domainServices[domain] || domainServices.ecommerce;
      const teamSize = inputs.teamSize as number;
      const idealServiceCount = Math.min(ds.services.length, Math.ceil(ds.services.length * 6 / teamSize));

      return {
        services: ds.services.slice(0, idealServiceCount).join('\n'),
        serviceCount: idealServiceCount,
        boundedContexts: ds.contexts.join('\n'),
        communicationMap: ds.comms.join('\n'),
        antiPatterns: ds.anti.join('\n'),
      };
    },
    tags: ['microservices', 'ddd', 'bounded-context', 'decomposition', 'architecture'],
  },

  // ─── RELIABILITY & RESILIENCE ────────────────────────────
  {
    id: 'reliability-calculator',
    name: 'System Reliability Calculator',
    shortName: 'Reliability',
    description: 'Calculate availability, MTBF, MTTR, and error budgets',
    category: 'reliability',
    difficulty: 'intermediate',
    estimatedTimeMinutes: 15,
    icon: '🛡️',
    color: 'text-red-400',
    inputs: [
      { key: 'mtbf', label: 'Mean Time Between Failures (hours)', type: 'number', defaultValue: 720, required: true },
      { key: 'mttr', label: 'Mean Time To Repair (hours)', type: 'number', defaultValue: 1, required: true },
      { key: 'sloTarget', label: 'SLO Target (%)', type: 'number', defaultValue: 99.9, min: 90, max: 100, step: 0.1 },
      { key: 'periodDays', label: 'Budget Period (days)', type: 'number', defaultValue: 30, min: 1, max: 365 },
    ],
    outputs: [
      { key: 'availability', label: 'Availability (%)', type: 'number', unit: '%' },
      { key: 'downtimePerMonth', label: 'Downtime per Month', type: 'number', unit: 'hours' },
      { key: 'errorBudgetMinutes', label: 'Error Budget (minutes)', type: 'number', unit: 'min' },
      { key: 'nines', label: 'Nines of Availability', type: 'number' },
      { key: 'fiveYearDowntime', label: '5-Year Downtime', type: 'number', unit: 'hours' },
    ],
    compute: (inputs) => {
      const availability = (inputs.mtbf as number) / ((inputs.mtbf as number) + (inputs.mttr as number));
      const availabilityPct = availability * 100;
      const downtimePerMonth = (1 - availability) * 720;
      const errorBudgetMinutes = (1 - availability) * (inputs.periodDays as number) * 24 * 60;
      const nines = -Math.log10(1 - availability);
      const fiveYearDowntime = (1 - availability) * 43800;
      return {
        availability: Math.round(availabilityPct * 1000) / 1000,
        downtimePerMonth: Math.round(downtimePerMonth * 100) / 100,
        errorBudgetMinutes: Math.round(errorBudgetMinutes),
        nines: Math.round(nines * 100) / 100,
        fiveYearDowntime: Math.round(fiveYearDowntime * 100) / 100,
      };
    },
    tags: ['reliability', 'availability', 'mtbf', 'mttr', 'error-budget', 'slo'],
  },
];