# System Design Tools Implementation Plan

## Overview
Add a "Tools" menu in the top toolbar with 26 interactive system design calculators/simulators organized into 6 categories, matching systemdesigner.net/tools.

---

## Tool Categories & Tools

### 1. 📊 Planning & Analysis (5 tools)
| Tool | Complexity | Time | Type |
|------|------------|------|------|
| Capacity Planning Examples | Intermediate | 20 min | Guide/Examples |
| Capacity Planning Tool | Intermediate | 15 min | Calculator |
| Cloud Cost Estimator | Intermediate | 20 min | Calculator |
| System Reliability Calculator | Intermediate | 15 min | Calculator |
| Scalability Planning Tool | Advanced | 20 min | Planner |

### 2. 🏗️ Architecture & Design (4 tools)
| Tool | Complexity | Time | Type |
|------|------------|------|------|
| Architecture Decision Records (ADR) | Intermediate | 15 min | Builder |
| API Design Builder | Intermediate | 15 min | Builder |
| Microservices Decomposer | Advanced | 15 min | Decomposer |
| Architecture Diagram Builder | Beginner | 20 min | Builder |

### 3. ⚡ Performance & Optimization (5 tools)
| Tool | Complexity | Time | Type |
|------|------------|------|------|
| Bandwidth Calculator | Beginner | 10 min | Calculator |
| Cache Strategy Simulator | Intermediate | 15 min | Simulator |
| Latency Simulator | Intermediate | 10 min | Simulator |
| Load Balancer Visualizer | Intermediate | 10 min | Visualizer |
| Cache Strategy Planner | Intermediate | 10 min | Planner |

### 4. 🗄️ Data & Storage (4 tools)
| Tool | Complexity | Time | Type |
|------|------------|------|------|
| Database Sizing Calculator | Intermediate | 15 min | Calculator |
| Database Selection Tool | Intermediate | 5 min | Selector |
| Consistency Model Explorer | Advanced | 10 min | Explorer |
| Database Sharding Visualizer | Advanced | 10 min | Visualizer |

### 5. 🛡️ Reliability & Resilience (3 tools)
| Tool | Complexity | Time | Type |
|------|------------|------|------|
| Rate Limit Tester | Intermediate | 10 min | Tester |
| Circuit Breaker Simulator | Intermediate | 10 min | Simulator |
| Message Queue Designer | Intermediate | 15 min | Designer |

### 5. 🔧 Other Tools (5 tools)
| Tool | Complexity | Time | Type |
|------|------------|------|------|
| CDN Performance Analyzer | Intermediate | 10 min | Analyzer |
| Load Prediction Tool | Advanced | 20 min | Predictor |
| Load Testing Guide | Intermediate | 25 min | Guide |
| System Design Calculator | Beginner | 5 min | Calculator |
| Google Agent Development Kit | Intermediate | 30 min | ADK Tool |

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. **Create Tools menu in top toolbar**
   - Add Tools dropdown button in `Toolbar.tsx`
   - Create `ToolsPanel.tsx` with category tabs
   - Add keyboard shortcut (⌘K / Ctrl+K) for quick access

2. **Build base components**
   - `ToolCard` component (icon, title, description, complexity badge, time estimate)
   - `ToolModal` component (full-screen tool workspace)
   - `ToolInput` / `ToolOutput` shared components
   - Result export (copy JSON, download CSV, share link)

3. **State management**
   - Add `tools` slice to `diagramStore` (or new `toolsStore`)
   - Persist tool results in localStorage
   - Tool history (recent tools, favorites)

### Phase 2: Calculators (Week 2) - 8 tools
**Simplest to implement - pure math, no simulation**

1. **System Design Calculator** - QPS, bandwidth, storage, latency calculations
2. **Capacity Planning Tool** - throughput × latency = concurrency (Little's Law)
3. **Cloud Cost Estimator** - compute, storage, network, data transfer costs
4. **System Reliability Calculator** - MTBF, MTTR, availability %, error budget
5. **Bandwidth Calculator** - message size × QPS × overhead = Mbps
6. **Database Sizing Calculator** - row size × rows × index overhead × replication
7. **Cache Strategy Planner** - hit rate, memory sizing, TTL optimization
8. **Load Prediction Tool** - time series forecasting (moving average, trend)

### Phase 3: Selectors & Builders (Week 3) - 5 tools
**Form-based with decision logic**

9. **Database Selection Tool** - workload type → recommended DBs (matrix scoring)
10. **Architecture Decision Records** - template + decision matrix + trade-offs
11. **API Design Builder** - REST/GraphQL/gRPC builder with OpenAPI export
12. **Message Queue Designer** - patterns (pub/sub, queue, stream) + broker comparison
13. **Scalability Planning Tool** - bottleneck identification + scaling strategies

### Phase 4: Simulators & Visualizers (Week 4) - 6 tools
**Interactive with real-time feedback**

14. **Cache Strategy Simulator** - workload trace → hit rate, eviction simulation
15. **Latency Simulator** - queueing theory (M/M/1, M/M/c) with visual queue
16. **Load Balancer Visualizer** - algorithm comparison (RR, LC, IP Hash, Consistent Hash)
17. **Rate Limit Tester** - token bucket, leaky bucket, sliding window visual
18. **Circuit Breaker Simulator** - state machine (closed/open/half-open) with failure injection
19. **Database Sharding Visualizer** - shard key distribution, rebalancing animation

### Phase 5: Advanced Tools (Week 5) - 3 tools
20. **Consistency Model Explorer** - linearizable → eventual, anomaly visualization
21. **Microservices Decomposer** - domain-driven decomposition with bounded contexts
22. **Architecture Diagram Builder** - drag-drop → export to Mermaid/PlantUML/Draw.io

### Phase 6: Guides & Examples (Week 6) - 2 tools
23. **Capacity Planning Examples** - real-world case studies
24. **Load Testing Guide** - k6/JMeter scripts generation + best practices

---

## Technical Architecture

### File Structure
```
apps/web/src/
├── components/
│   ├── tools/
│   │   ├── ToolsMenu.tsx           # Top toolbar dropdown
│   │   ├── ToolsPanel.tsx          # Category grid + search
│   │   ├── ToolCard.tsx            # Tool preview card
│   │   ├── ToolModal.tsx           # Full-screen workspace
│   │   ├── ToolHistory.tsx         # Recent/favorite tools
│   │   └── tools/
│   │       ├── calculators/
│   │       │   ├── SystemDesignCalculator.tsx
│   │       │   ├── CapacityPlanningTool.tsx
│   │       │   ├── CloudCostEstimator.tsx
│   │       │   ├── SystemReliabilityCalculator.tsx
│   │       │   ├── BandwidthCalculator.tsx
│   │       │   ├── DatabaseSizingCalculator.tsx
│   │       │   ├── CacheStrategyPlanner.tsx
│   │       │   └── LoadPredictionTool.tsx
│   │       ├── selectors/
│   │       │   ├── DatabaseSelectionTool.tsx
│   │       │   ├── ADRBuilder.tsx
│   │       │   ├── APIDesignBuilder.tsx
│   │       │   ├── MessageQueueDesigner.tsx
│   │       │   └── ScalabilityPlanner.tsx
│   │       ├── simulators/
│   │       │   ├── CacheStrategySimulator.tsx
│   │       │   ├── LatencySimulator.tsx
│   │       │   ├── LoadBalancerVisualizer.tsx
│   │       │   ├── RateLimitTester.tsx
│   │       │   ├── CircuitBreakerSimulator.tsx
│   │       │   └── DatabaseShardingVisualizer.tsx
│   │       └── advanced/
│   │           ├── ConsistencyModelExplorer.tsx
│   │           ├── MicroservicesDecomposer.tsx
│   │           └── ArchitectureDiagramBuilder.tsx
│   │   └── index.ts                # Tool registry
│   └── toolbar/
│       └── Toolbar.tsx             # Add ToolsMenu import
├── stores/
│   └── toolsStore.ts               # Zustand store for tool state
├── types/
│   └── tools.ts                    # Tool types, categories, inputs/outputs
├── utils/
│   └── tools/
│       ├── formulas.ts             # Shared math formulas
│       ├── cloudPricing.ts         # AWS/Azure/GCP pricing data
│       ├── queueingTheory.ts       # M/M/1, M/M/c, Little's Law
│       └── export.ts               # JSON/CSV/URL export
```

### Tool Registry Pattern
```typescript
// apps/web/src/components/tools/tools/index.ts
export interface Tool {
  id: string;
  category: ToolCategory;
  title: string;
  description: string;
  icon: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string; // "15 min"
  tags: string[];
  component: React.ComponentType<ToolProps>;
  shortcuts?: string[]; // e.g., ['C', 'S'] for Capacity Scaling
}

export const TOOL_REGISTRY: Tool[] = [
  {
    id: 'system-design-calculator',
    category: 'planning',
    title: 'System Design Calculator',
    description: 'QPS, bandwidth, storage, latency calculations',
    icon: '🧮',
    complexity: 'beginner',
    estimatedTime: '5 min',
    tags: ['qps', 'bandwidth', 'latency', 'storage'],
    component: SystemDesignCalculator,
  },
  // ... all 26 tools
];
```

### Shared Utilities

**Formulas** (`utils/tools/formulas.ts`):
```typescript
export const littleLaw = (throughput: number, latencySec: number) => throughput * latencySec;
export const availability = (mtbf: number, mttr: number) => mtbf / (mtbf + mttr);
export const errorBudget = (availability: number, periodSec: number) => (1 - availability) * periodSec;
export const bandwidthMbps = (msgSizeBytes: number, qps: number, overhead = 1.2) => (msgSizeBytes * qps * overhead * 8) / 1e6;
export const storageGB = (rowSizeBytes: number, rows: number, replication = 3, indexOverhead = 1.3) => (rowSizeBytes * rows * replication * indexOverhead) / 1e9;
```

**Cloud Pricing** (`utils/tools/cloudPricing.ts`):
```typescript
export const cloudPricing = {
  aws: { compute: { 't3.medium': 0.0416 }, storage: { gp3: 0.08 }, network: { perGB: 0.09 } },
  azure: { compute: { 'B2s': 0.0416 }, storage: { premium: 0.15 }, network: { perGB: 0.087 } },
  gcp: { compute: { 'e2-medium': 0.033 }, storage: { pd-ssd: 0.17 }, network: { perGB: 0.12 } },
};
```

**Queueing Theory** (`utils/tools/queueingTheory.ts`):
```typescript
export const mm1 = (lambda: number, mu: number) => ({
  utilization: lambda / mu,
  avgQueueLength: lambda**2 / (mu * (mu - lambda)),
  avgWaitTime: lambda / (mu * (mu - lambda)),
  avgResponseTime: 1 / (mu - lambda),
});
```

---

## UI/UX Design

### Tools Menu (Top Toolbar)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Canvas    Simulate  Chaos  Tools ▼  Export  User   │
│                                    ┌─────────────────────┐  │
│                                    │ 🔍 Search tools...  │  │
│                                    ├─────────────────────┤  │
│                                    │ 📊 Planning (5)     │  │
│                                    │ 🏗️ Architecture (4) │  │
│                                    │ ⚡ Performance (5)  │  │
│                                    │ 🗄️ Data (4)          │  │
│                                    │ 🛡️ Reliability (3)  │  │
│                                    │ 🔧 Other (5)         │  │
│                                    ├─────────────────────┤  │
│                                    │ ⭐ Favorites         │  │
│                                    │ 🕐 Recent            │  │
│                                    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tool Modal (Full-screen)
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    Capacity Planning Tool          [Export] [Share]  │
├─────────────────────────────────────────────────────────────┤
│ INPUTS                    │ RESULTS                          │
│ ┌─────────────────────┐  │ ┌─────────────────────────────┐  │
│ │ QPS: [1000      ] ▼ │  │ │ Concurrency: 50             │  │
│ │ Latency (ms): [50 ]   │  │ │ Required Instances: 3     │  │
│ │ Target Util: [0.7 ]   │  │ │ Monthly Cost: $180        │  │
│ │                       │  │ │                             │  │
│ │ [Calculate]           │  │ │ [Copy JSON] [Download CSV] │  │
│ └─────────────────────┘  │ └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependencies
```json
{
  "dependencies": {
    "chart.js": "^4.x",           // For visualizers
    "date-fns": "^3.x",           // Time calculations
    "lodash": "^4.x",             // Utility functions
    "zod": "^3.x"                 // Input validation
  }
}
```

---

## Priority Order (MVP → Full)

### Sprint 1 (MVP - 4 tools, 1 week)
1. System Design Calculator (covers 80% of basic needs)
2. Capacity Planning Tool (core planning)
3. Database Selection Tool (high value decision)
4. Load Balancer Visualizer (visual, impressive)

### Sprint 2 (Calculators - 4 tools)
5. Cloud Cost Estimator
6. System Reliability Calculator
7. Bandwidth Calculator
8. Database Sizing Calculator

### Sprint 3 (Selectors - 3 tools)
9. Cache Strategy Planner
10. ADR Builder
11. Message Queue Designer

### Sprint 4 (Simulators - 4 tools)
12. Latency Simulator
13. Rate Limit Tester
14. Circuit Breaker Simulator
15. Load Balancer Visualizer (enhanced)

### Sprint 5 (Advanced - 3 tools)
16. Database Sharding Visualizer
17. Consistency Model Explorer
18. Microservices Decomposer

### Sprint 6 (Remaining - 4 tools)
19. Architecture Diagram Builder
20. Cache Strategy Simulator
21. Capacity Planning Examples
22. Load Testing Guide
23. Load Prediction Tool
24. CDN Performance Analyzer
25. Scalability Planning Tool
26. Google Agent Development Kit (placeholder)

---

## Success Criteria
- [ ] All 26 tools accessible from top toolbar
- [ ] Each tool completes in stated time
- [ ] Results exportable (JSON, CSV, shareable URL)
- [ ] Works offline (localStorage persistence)
- [ ] Keyboard shortcuts for power users
- [ ] Mobile-responsive tool modals
- [ ] TypeScript strict mode passes
- [ ] Build passes on Vercel

---

## Next Steps
1. **Approve plan** → I'll create the PRD for Phase 1
2. **Set up tool registry & store** → Foundation
3. **Build first 4 MVP tools** → Quick wins
4. **Iterate based on feedback**