import { useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { X, Trash2 } from 'lucide-react'
import type { Edge } from '@xyflow/react'

interface EdgePropertiesPanelProps {
  edge: Edge
  onDelete: (edgeId: string) => void
  onClose: () => void
}

export function EdgePropertiesPanel({ edge, onDelete, onClose }: EdgePropertiesPanelProps) {
  const store = useDiagramStore()
  const edgeData = (edge.data as Record<string, unknown>) || {}

  const [label, setLabel] = useState(String(edgeData.label || ''))
  const [protocol, setProtocol] = useState(String(edgeData.protocol || 'HTTP'))
  const [bandwidthMbps, setBandwidthMbps] = useState(String(edgeData.bandwidthMbps || 1000))
  const [latencyMs, setLatencyMs] = useState(String(edgeData.latencyMs || 0))
  const [encrypted, setEncrypted] = useState(Boolean(edgeData.encrypted || false))

  const handleSave = () => {
    const updatedData = {
      label,
      protocol,
      bandwidthMbps: Number(bandwidthMbps) || 1000,
      latencyMs: Number(latencyMs) || 0,
      encrypted,
    }
    // Update edge in store
    const updatedEdges = store.edges.map((e: any) =>
      e.id === edge.id ? { ...e, data: updatedData } : e
    )
    store.setEdges(updatedEdges as any)
  }

  const handleDelete = () => {
    onDelete(edge.id)
    onClose()
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-64 bg-surface border-l border-border flex flex-col shrink-0 overflow-hidden z-30">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider">Edge Properties</h2>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Connection info */}
        <div>
          <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Connection</label>
          <div className="mt-1 text-[10px] text-text font-mono bg-bg rounded px-2 py-1.5 border border-border">
            {edge.source} → {edge.target}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Label</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            placeholder="e.g. API Call, DB Query"
            className="mt-1 w-full text-[10px] text-text bg-bg border border-border rounded px-2 py-1.5 outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Protocol */}
        <div>
          <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Protocol</label>
          <select
            value={protocol}
            onChange={(e) => { setProtocol(e.target.value); handleSave() }}
            className="mt-1 w-full text-[10px] text-text bg-bg border border-border rounded px-2 py-1.5 outline-none focus:border-accent transition-colors cursor-pointer"
          >
            <option value="HTTP">HTTP</option>
            <option value="HTTPS">HTTPS</option>
            <option value="gRPC">gRPC</option>
            <option value="WebSocket">WebSocket</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="AMQP">AMQP</option>
            <option value="Kafka">Kafka</option>
            <option value="Redis">Redis Protocol</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MySQL">MySQL</option>
            <option value="MongoDB">MongoDB</option>
          </select>
        </div>

        {/* Bandwidth */}
        <div>
          <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Bandwidth (Mbps)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex items-center border border-border rounded-md bg-bg overflow-hidden shrink-0">
              <input
                type="text"
                value={bandwidthMbps}
                onChange={(e) => setBandwidthMbps(e.target.value)}
                onBlur={handleSave}
                className="w-20 text-center text-[10px] text-text font-mono bg-transparent outline-none border-r border-border py-1"
              />
              <span className="text-[9px] text-text-dim pr-1.5">Mbps</span>
            </div>
            <input
              type="range"
              min={1}
              max={10000}
              step={1}
              value={Number(bandwidthMbps) || 1000}
              onChange={(e) => { setBandwidthMbps(e.target.value); handleSave() }}
              className="flex-1 h-1 accent-accent cursor-pointer min-w-0"
            />
          </div>
        </div>

        {/* Latency */}
        <div>
          <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Latency (ms)</label>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex items-center border border-border rounded-md bg-bg overflow-hidden shrink-0">
              <input
                type="text"
                value={latencyMs}
                onChange={(e) => setLatencyMs(e.target.value)}
                onBlur={handleSave}
                className="w-16 text-center text-[10px] text-text font-mono bg-transparent outline-none border-r border-border py-1"
              />
              <span className="text-[9px] text-text-dim pr-1.5">ms</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Number(latencyMs) || 0}
              onChange={(e) => { setLatencyMs(e.target.value); handleSave() }}
              className="flex-1 h-1 accent-accent cursor-pointer min-w-0"
            />
          </div>
        </div>

        {/* Encrypted */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-dim">Encrypted (TLS/mTLS)</span>
          <button
            type="button"
            onClick={() => { setEncrypted(!encrypted); handleSave() }}
            className={`relative w-8 h-4 rounded-full transition-colors ${encrypted ? 'bg-accent' : 'bg-border'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${encrypted ? 'left-4.5' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Delete button */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Connection
          </button>
        </div>
      </div>
    </div>
  )
}
