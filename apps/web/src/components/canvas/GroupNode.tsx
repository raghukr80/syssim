import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface GroupNodeData {
  componentType: string
  label: string
  icon?: string
  config?: any
  status?: string
}

const GROUP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  cloud_provider: { bg: 'rgba(99, 102, 241, 0.05)', border: 'rgba(99, 102, 241, 0.3)', text: '#818cf8' },
  region: { bg: 'rgba(34, 197, 94, 0.05)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80' },
  availability_zone: { bg: 'rgba(234, 179, 8, 0.05)', border: 'rgba(234, 179, 8, 0.3)', text: '#facc15' },
  vpc_group: { bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
  subnet: { bg: 'rgba(168, 85, 247, 0.05)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' },
  corp_dc: { bg: 'rgba(20, 184, 166, 0.05)', border: 'rgba(20, 184, 166, 0.3)', text: '#2dd4bf' },
  on_prem: { bg: 'rgba(20, 184, 166, 0.05)', border: 'rgba(20, 184, 166, 0.3)', text: '#2dd4bf' },
  kubernetes_cluster: { bg: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa' },
  server_pool: { bg: 'rgba(249, 115, 22, 0.05)', border: 'rgba(249, 115, 22, 0.3)', text: '#fb923c' },
}

function GroupNodeComponent({ data, id }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState((data as unknown as GroupNodeData).label || 'Group')

  const nodeData = data as unknown as GroupNodeData
  const nodeType = nodeData.componentType || 'cloud_provider'
  const colors = GROUP_COLORS[nodeType] || GROUP_COLORS.cloud_provider

  return (
    <div
      className="rounded-xl border-2 border-dashed min-w-[200px] min-h-[120px] relative"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-xl flex items-center gap-2"
        style={{ borderBottom: `1px dashed ${colors.border}` }}
        onDoubleClick={() => setIsEditing(true)}
      >
        <span className="text-sm">{nodeData.icon || '📦'}</span>
        {isEditing ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false) }}
            className="text-xs font-semibold bg-transparent outline-none border-b border-accent text-text flex-1"
          />
        ) : (
          <span className="text-xs font-semibold truncate" style={{ color: colors.text }}>
            {label}
          </span>
        )}
        <span className="text-[9px] text-text-dim ml-auto">{nodeType.replace(/_/g, ' ')}</span>
      </div>

      {/* Drop zone indicator */}
      <div className="flex items-center justify-center py-4 text-text-dim text-[10px]">
        Drop components here
      </div>

      {/* Connection handles on all sides */}
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-accent border-0" />
      <Handle type="source" position={Position.Top} className="w-2 h-2 bg-accent border-0" />
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-accent border-0" />
      <Handle type="source" position={Position.Left} className="w-2 h-2 bg-accent border-0" />
      <Handle type="target" position={Position.Right} className="w-2 h-2 bg-accent border-0" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-accent border-0" />
      <Handle type="target" position={Position.Bottom} className="w-2 h-2 bg-accent border-0" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-accent border-0" />
    </div>
  )
}

export const GroupNode = memo(GroupNodeComponent)
