import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useDiagramStore } from '../../stores/diagramStore'
import { getComponentMeta } from '../../types/components'
import { Zap } from 'lucide-react'
import type { SimNode } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  idle: 'var(--color-text-dim)',
  running: 'var(--color-success)',
  degraded: 'var(--color-warning)',
  failed: 'var(--color-error)',
}

const DEFAULT_NODE_COLOR = '#6366f1'

function ComponentNodeComponent(props: any) {
  const { data, id, selected } = props as { data: SimNode['data']; id: string; selected?: boolean }
  const store = useDiagramStore()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label)
  const inputRef = useRef<HTMLInputElement>(null)

  const statusColor = STATUS_COLORS[data.status] || STATUS_COLORS.idle
  const nodeColor = data.color || DEFAULT_NODE_COLOR
  const metrics = data.metrics

  // Get cloud provider equivalent service name
  const provider = data.cloudProvider || 'aws'
  const meta = getComponentMeta(data.componentType)
  const providerService = meta?.cloudEquivalents?.[provider as keyof typeof meta.cloudEquivalents] || ''

  // Check if this node has active chaos
  const activeChaos = useDiagramStore(s => s.activeChaos)
  const nodeChaos = activeChaos.filter(c => c.targetNodeId === id)
  const hasChaos = nodeChaos.length > 0

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Sync editValue when data.label changes externally
  useEffect(() => {
    setEditValue(data.label)
  }, [data.label])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(true)
    setEditValue(data.label)
  }

  const handleBlur = () => {
    setEditing(false)
    if (editValue.trim() && editValue !== data.label) {
      store.updateNodeLabel(id, editValue.trim())
    } else {
      setEditValue(data.label)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditValue(data.label)
      setEditing(false)
    }
  }

  // Icon rendering — data.icon is either a URL path to SVG or an emoji string
  const iconUrl = data.icon && data.icon.startsWith('/') ? data.icon : null
  const emojiIcon = data.icon && !data.icon.startsWith('/') ? data.icon : null

  return (
    <div
      className={`rounded-lg border-2 bg-surface min-w-[150px] shadow-lg transition-shadow ${
        selected ? 'border-accent shadow-accent/20' : 'border-border'
      }`}
      style={{ borderLeftColor: nodeColor, borderLeftWidth: 4 }}
    >
      <Handle id="top" type="source" position={Position.Top} className="w-3 h-3 bg-accent border-2 border-surface" />

      <Handle id="left" type="source" position={Position.Left} className="w-3 h-3 bg-accent border-2 border-surface" />

      {/* Header */}
      <div className="px-3 py-2 border-b border-border relative" onDoubleClick={handleDoubleClick}>
        {hasChaos && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="w-5 h-5 rounded-full bg-error/90 flex items-center justify-center animate-pulse shadow-lg shadow-error/30">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Custom icon or default emoji */}
          {iconUrl ? (
            <img src={iconUrl} alt="" className="w-4 h-4 shrink-0" />
          ) : emojiIcon ? (
            <span className="text-sm shrink-0">{emojiIcon}</span>
          ) : (
            <span className="text-sm shrink-0">⚙️</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-text-dim uppercase tracking-wider">{data.componentType.replace(/_/g, ' ')}</div>
            {editing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="text-sm font-semibold text-text bg-bg border border-accent rounded px-1 py-0.5 w-full outline-none mt-0.5"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="text-sm font-semibold text-text mt-0.5 truncate" title="Double-click to edit">
                {data.label}
              </div>
            )}
          </div>
        </div>

        {/* Tag */}
        {data.tag && (
          <div
            className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
            style={{ backgroundColor: nodeColor + '20', color: nodeColor }}
          >
            {data.tag}
          </div>
        )}
        
        {/* Cloud provider service name */}
        <div className="text-[9px] text-text-dim mt-1 truncate">{providerService}</div>
      </div>

      {/* Live metrics when running */}
      {metrics && (data.status === 'running' || data.status === 'degraded' || data.status === 'failed') && (
        <div className="px-3 py-1.5 text-[10px] grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-border/50 bg-surface-hover/50">
          <span className="text-text-dim">RPS</span>
          <span className="text-text font-mono text-right">{metrics.currentRps.toLocaleString()}</span>
          <span className="text-text-dim">P99</span>
          <span className="text-text font-mono text-right">{metrics.p99Latency.toFixed(0)}ms</span>
          <span className="text-text-dim">Errors</span>
          <span className={`font-mono text-right ${metrics.errorRate > 0.05 ? 'text-error' : metrics.errorRate > 0.01 ? 'text-warning' : 'text-success'}`}>
            {(metrics.errorRate * 100).toFixed(1)}%
          </span>
          <span className="text-text-dim">Util</span>
          <span className={`font-mono text-right ${metrics.utilization > 0.9 ? 'text-error' : metrics.utilization > 0.7 ? 'text-warning' : 'text-text'}`}>
            {(metrics.utilization * 100).toFixed(0)}%
          </span>
        </div>
      )}

      <Handle id="top" type="source" position={Position.Top} className="w-3 h-3 bg-accent border-2 border-surface" />

      <Handle id="left" type="source" position={Position.Left} className="w-3 h-3 bg-accent border-2 border-surface" />

      <Handle id="right" type="source" position={Position.Right} className="w-3 h-3 bg-accent border-2 border-surface" />

      <Handle id="bottom" type="source" position={Position.Bottom} className="w-3 h-3 bg-accent border-2 border-surface" />
    </div>
  )
}

export const ComponentNode = memo(ComponentNodeComponent)
