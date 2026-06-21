# SysSim — System Design Simulator

An interactive system design and chaos engineering simulator for visualizing, testing, and validating cloud architecture designs. Drag and drop components, configure them, run simulations, inject chaos events, and observe how your architecture behaves under stress and failure conditions.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Architecture Design
- **70+ cloud components** across 8 categories: Networking, Compute, Data & Storage, Messaging, Security, Observability, ML/AI, and External
- **Visual canvas** with drag-and-drop component placement using React Flow
- **Layout Zones** — resizable, named container boundaries (Cloud, Region, AZ, VPC, Subnet, etc.) to organize your architecture
- **Component-specific configurations** — each component type has detailed config fields (RPS, latency, replication, auto-scaling, caching, etc.)
- **Custom icons** — 1,600+ SVG icons from Devicon for AWS, Azure, GCP, and tech stack components
- **Dark/Light mode** toggle

### Simulation Engine
- **Real-time simulation** with live metrics (RPS, P99 latency, error rates, utilization)
- **Traffic multiplier** (0.5x–5x) and **speed multiplier** (0.5x–10x) controls
- **Component-specific simulation behavior** — cache hit ratios, database replication, auto-scaling, serverless cold starts, rate limiting, circuit breakers
- **Particle flow visualization** showing traffic moving between components
- **Event log** — real-time log of simulation events (high latency, errors, overload, chaos effects)
- **Simulation report** — downloadable Markdown report with executive summary, node performance, incident history, and engineering recommendations

### Chaos Engineering
- **20+ chaos scenarios** across 6 categories: Network, Infrastructure, Traffic, Data, Application, Dependencies
- **Target selection** — choose specific components to inject chaos into, not just all compatible ones
- **Active chaos management** — view, remove individual events, or clear all chaos
- **Realistic failure modes** — latency spikes, packet loss, CPU saturation, memory pressure, disk full, cache poisoning, connection pool exhaustion, certificate expiry, and more

### Import/Export
- **Export/Import** diagrams as JSON
- **Blueprints** — save and load architecture templates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| State Management | Zustand |
| Canvas / Diagrams | React Flow v12 |
| Styling | Tailwind CSS 3 |
| Build Tool | Vite 6 |
| Charts | Recharts |
| Icons | Lucide React + Devicon (1,600+ SVG icons) |
| Simulation | JavaScript (with optional WASM backend) |

## Project Structure

```
syssim/
├── apps/
│   └── web/                    # Main web application
│       ├── public/
│       │   └── icons/          # SVG icon library (1,600+ icons)
│       │       ├── aws/        # AWS service icons (311)
│       │       ├── azure/      # Azure service icons (705)
│       │       ├── gcp/        # GCP service icons (216)
│       │       └── tech/       # General tech icons (424)
│       ├── scripts/
│       │   └── build-icon-manifest.cjs  # Icon manifest generator
│       └── src/
│           ├── components/
│           │   ├── canvas/     # SimulatorCanvas, ComponentNode, GroupNode, ParticleCanvas, LayoutZones
│           │   ├── palette/    # ComponentPalette, ChaosPanel
│           │   ├── properties/ # PropertiesPanel, EdgePropertiesPanel, IconPicker
│           │   ├── toolbar/    # Toolbar, SimulationControls, ChaosPanel, BlueprintPanel, CostPanel
│           │   └── metrics/    # StatusBar, MetricsPanel, EventLog, ReportModal
│           ├── data/           # Icon manifest, component catalog
│           ├── stores/         # Zustand store (diagramStore)
│           ├── types/          # TypeScript type definitions
│           └── wasm/           # WASM simulation engine bindings
├── packages/
│   └── sim-engine/             # Rust-based WASM simulation engine (optional)
└── package.json                # Yarn workspaces root
```

## Prerequisites

- **Node.js** >= 18
- **Yarn** 1.22+ (package manager)
- Modern browser with ES2020+ support (Chrome 90+, Firefox 90+, Safari 15+)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/raghukr80/syssim.git
cd syssim
```

### 2. Install dependencies

```bash
yarn install
```

### 3. (Optional) Build the WASM simulation engine

The app works with a JavaScript simulation fallback by default. For the optional Rust/WASM engine:

```bash
# Install Rust toolchain if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Build the WASM engine
yarn build:wasm
```

### 4. Start the development server

```bash
yarn dev
```

The app will be available at `http://localhost:3000`.

### 5. Build for production

```bash
yarn build
```

Output will be in `apps/web/dist/`.

### 6. Preview production build

```bash
yarn workspace web preview
```

## Usage

### Designing an Architecture

1. **Add components** — Drag components from the left palette onto the canvas
2. **Create layout zones** — Click "Add Layout Zone" in the toolbar to create resizable container boundaries
3. **Connect components** — Drag from any handle (top/left/right/bottom) of one node to another
4. **Configure components** — Click a node to open the Properties panel. Adjust RPS, latency, replication, auto-scaling, etc.
5. **Customize appearance** — Change node color, icon, label, and tag in the Properties panel

### Running a Simulation

1. Click the **Play** button in the top-right control panel
2. Adjust **Speed** (0.5x–10x) and **Traffic** (0.5x–5x) multipliers
3. Watch live metrics in the StatusBar and on each node
4. View real-time events in the Event Log (bottom-left)
5. Click **Stop** to end the simulation and view the downloadable report

### Chaos Engineering

1. Click the **Chaos** button in the toolbar
2. Browse chaos scenarios by category (Network, Infrastructure, Traffic, Data, Application, Dependencies)
3. Click **Inject** on a scenario:
   - If only 1 compatible node exists, chaos is applied directly
   - If multiple compatible nodes exist, a target selection modal appears
4. In the target selector, choose specific nodes and click **Inject Chaos**
5. Active chaos events appear in the modal with individual remove buttons
6. Click **Clear All** to remove all active chaos events

### Export/Import

- **Export** — Click the Export button to download your diagram as JSON
- **Import** — Click Import to load a previously exported diagram
- **Blueprints** — Use the Blueprints button to load pre-built architecture templates

## Configuration

### Adding Custom Icons

Place SVG files in the appropriate `public/icons/<category>/` folder, then run:

```bash
yarn workspace web build:icons
```

The icon manifest is auto-generated. Filenames become display names (e.g., `api-gateway.svg` → "Api Gateway").

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APP_TITLE` | `SysSim` | Application title |
| `VITE_SIM_ENGINE` | `js` | Simulation engine: `js` or `wasm` |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected nodes/edges |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Escape` | Deselect all / Close panels |

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [React Flow](https://reactflow.dev/) — Node-based canvas library
- [Devicon](https://devicon.dev/) — Open-source icon library for programming languages, tools, and frameworks
- [Lucide](https://lucide.dev/) — Beautiful & consistent icon set
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- Inspired by [syssimulator.com](https://syssimulator.com/simulator)
