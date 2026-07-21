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