import { useState, useRef, useCallback, useEffect } from 'react'
import { X, GripVertical } from 'lucide-react'

export interface LayoutZone {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  borderColor: string
}

const ZONE_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.05)', border: 'rgba(99, 102, 241, 0.3)', label: 'Indigo' },
  { bg: 'rgba(34, 197, 94, 0.05)', border: 'rgba(34, 197, 94, 0.3)', label: 'Green' },
  { bg: 'rgba(234, 179, 8, 0.05)', border: 'rgba(234, 179, 8, 0.3)', label: 'Yellow' },
  { bg: 'rgba(239, 68, 68, 0.05)', border: 'rgba(239, 68, 68, 0.3)', label: 'Red' },
  { bg: 'rgba(168, 85, 247, 0.05)', border: 'rgba(168, 85, 247, 0.3)', label: 'Purple' },
  { bg: 'rgba(20, 184, 166, 0.05)', border: 'rgba(20, 184, 166, 0.3)', label: 'Teal' },
  { bg: 'rgba(249, 115, 22, 0.05)', border: 'rgba(249, 115, 22, 0.3)', label: 'Orange' },
  { bg: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.3)', label: 'Blue' },
]

let zoneIdCounter = 0

export interface LayoutZoneState {
  zones: LayoutZone[]
  selectedZoneId: string | null
  addZone: () => void
  updateZone: (id: string, updates: Partial<LayoutZone>) => void
  deleteZone: (id: string) => void
  renameZone: (id: string, name: string) => void
  setSelectedZoneId: (id: string | null) => void
}

export function useLayoutZones(): LayoutZoneState {
  const [zones, setZones] = useState<LayoutZone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  const addZone = useCallback(() => {
    const colorIndex = zones.length % ZONE_COLORS.length
    const color = ZONE_COLORS[colorIndex]
    const newZone: LayoutZone = {
      id: `zone_${++zoneIdCounter}`,
      name: `Zone ${zones.length + 1}`,
      x: 50 + (zones.length * 30) % 200,
      y: 50 + (zones.length * 30) % 200,
      width: 280,
      height: 200,
      color: color.bg,
      borderColor: color.border,
    }
    setZones(prev => [...prev, newZone])
    setSelectedZoneId(newZone.id)
  }, [zones.length])

  const updateZone = useCallback((id: string, updates: Partial<LayoutZone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z))
  }, [])

  const deleteZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id))
    setSelectedZoneId(prev => prev === id ? null : prev)
  }, [])

  const renameZone = useCallback((id: string, name: string) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, name } : z))
  }, [])

  return { zones, selectedZoneId, setSelectedZoneId, addZone, updateZone, deleteZone, renameZone }
}

// ── Individual Zone Component ──
function ZoneBox({
  zone,
  isSelected,
  onSelect,
  onRename,
  onDelete,
  onUpdate,
}: {
  zone: LayoutZone
  isSelected: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onUpdate: (updates: Partial<LayoutZone>) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(zone.name)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStart = useRef<{ mouseX: number; mouseY: number; zoneX: number; zoneY: number } | null>(null)
  const resizeStart = useRef<{ mouseX: number; mouseY: number; w: number; h: number; x: number; y: number; edge: string } | null>(null)

  // Global mouse move/up for drag and resize
  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStart.current) {
        const dx = e.clientX - dragStart.current.mouseX
        const dy = e.clientY - dragStart.current.mouseY
        onUpdate({ x: dragStart.current.zoneX + dx, y: dragStart.current.zoneY + dy })
      }
      if (isResizing && resizeStart.current) {
        const dx = e.clientX - resizeStart.current.mouseX
        const dy = e.clientY - resizeStart.current.mouseY
        const { edge, w, h, x, y } = resizeStart.current
        const updates: Partial<LayoutZone> = {}
        if (edge.includes('e')) updates.width = Math.max(150, w + dx)
        if (edge.includes('s')) updates.height = Math.max(100, h + dy)
        if (edge.includes('w')) { updates.width = Math.max(150, w - dx); updates.x = x + dx }
        if (edge.includes('n')) { updates.height = Math.max(100, h - dy); updates.y = y + dy }
        onUpdate(updates)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      dragStart.current = null
      resizeStart.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, onUpdate])

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect()
    setIsDragging(true)
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, zoneX: zone.x, zoneY: zone.y }
  }

  const handleResizeMouseDown = (e: React.MouseEvent, edge: string) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: zone.width, h: zone.height, x: zone.x, y: zone.y, edge }
  }

  const finishEditing = () => {
    if (editName.trim() && editName !== zone.name) onRename(editName.trim())
    setIsEditing(false)
  }

  return (
    <div
      className="absolute"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        zIndex: isSelected ? 10 : 1,
        pointerEvents: 'none', // Let clicks pass through to nodes inside
      }}
    >
      {/* Background border — purely visual */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          backgroundColor: zone.color,
          border: `2px dashed ${isSelected ? zone.borderColor.replace('0.3', '0.7') : zone.borderColor}`,
          pointerEvents: 'none',
        }}
      />

      {/* Zone header — this is the only interactive part for dragging */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-xl cursor-grab active:cursor-grabbing"
        style={{
          borderBottom: `1px dashed ${zone.borderColor}`,
          pointerEvents: 'auto',
        }}
        onMouseDown={handleHeaderMouseDown}
      >
        <GripVertical className="w-3 h-3 text-text-dim shrink-0" />
        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => { if (e.key === 'Enter') finishEditing(); if (e.key === 'Escape') setIsEditing(false) }}
            className="flex-1 text-[10px] font-semibold bg-transparent outline-none text-text min-w-0"
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-[10px] font-semibold text-text truncate cursor-text"
            onDoubleClick={(e) => { e.stopPropagation(); setEditName(zone.name); setIsEditing(true) }}
            title="Double-click to rename"
          >
            {zone.name}
          </span>
        )}
        {isSelected && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-0.5 rounded hover:bg-error/20 text-text-dim hover:text-error transition-colors shrink-0"
            onMouseDown={(e) => e.stopPropagation()}
            title="Delete zone"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Zone label — visual only */}
      <div
        className="absolute inset-0 flex items-center justify-center text-text-dim text-[10px] pointer-events-none"
        style={{ paddingTop: 24 }}
      >
        {isSelected ? 'Drag header to move · Edges to resize' : 'Drop components here'}
      </div>

      {/* Resize handles — only visible when selected, pointer-events-auto */}
      {isSelected && (
        <>
          <div className="absolute top-0 left-4 right-4 h-3 cursor-n-resize rounded-t hover:bg-accent/20" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
          <div className="absolute bottom-0 left-4 right-4 h-3 cursor-s-resize rounded-b hover:bg-accent/20" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
          <div className="absolute top-4 left-0 bottom-4 w-3 cursor-w-resize rounded-l hover:bg-accent/20" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
          <div className="absolute top-4 right-0 bottom-4 w-3 cursor-e-resize rounded-r hover:bg-accent/20" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
          <div className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize rounded-tl-lg hover:bg-accent/30" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
          <div className="absolute top-0 right-0 w-5 h-5 cursor-ne-resize rounded-tr-lg hover:bg-accent/30" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-5 h-5 cursor-sw-resize rounded-bl-lg hover:bg-accent/30" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize rounded-br-lg hover:bg-accent/30" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
        </>
      )}
    </div>
  )
}

// ── Zone Renderer ──
export function LayoutZonesRenderer({
  zones,
  selectedZoneId,
  onSelect,
  onUpdate,
  onRename,
  onDelete,
}: {
  zones: LayoutZone[]
  selectedZoneId: string | null
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<LayoutZone>) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="absolute inset-0" style={{ zIndex: 0, pointerEvents: 'none' }}>
      {zones.map(zone => (
        <ZoneBox
          key={zone.id}
          zone={zone}
          isSelected={selectedZoneId === zone.id}
          onSelect={() => onSelect(zone.id)}
          onRename={(name) => onRename(zone.id, name)}
          onDelete={() => onDelete(zone.id)}
          onUpdate={(updates) => onUpdate(zone.id, updates)}
        />
      ))}
    </div>
  )
}
