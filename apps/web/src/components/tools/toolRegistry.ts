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
];