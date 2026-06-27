import { useEffect, useRef, useState, useCallback } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react'

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20', badge: 'bg-info/20 text-info' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', badge: 'bg-warning/20 text-warning' },
  critical: { icon: AlertCircle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', badge: 'bg-error/20 text-error' },
}

export function EventLog() {
  const events = useDiagramStore(s => s.events)
  const showEventLog = useDiagramStore(s => s.showEventLog)
  const setShowEventLog = useDiagramStore(s => s.setShowEventLog)
  const clearEvents = useDiagramStore(s => s.clearEvents)
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoScroll = useRef(true)
  const [position, setPosition] = useState({ x: 16, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 })

  // Initialize position on mount — place at bottom-left
  useEffect(() => {
    setPosition({ x: 16, y: window.innerHeight - 280 })
  }, [])

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events.length])

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      autoScroll.current = scrollHeight - scrollTop - clientHeight < 40
    }
  }

  // Drag handlers — simple delta-based movement with top positioning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setDragging(true)
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    }
  }, [position])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.mouseX
      const dy = e.clientY - dragStart.current.mouseY
      const newX = Math.max(0, Math.min(dragStart.current.posX + dx, window.innerWidth - 380))
      const newY = Math.max(0, Math.min(dragStart.current.posY + dy, window.innerHeight - 280))
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  const recentEvents = events.slice(-50)
  const criticalCount = events.filter(e => e.severity === 'critical').length
  const warningCount = events.filter(e => e.severity === 'warning').length

  if (!showEventLog) {
    return (
      <button
        onClick={() => setShowEventLog(true)}
        className="fixed bottom-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 bg-surface/95 border border-border rounded-lg shadow-lg text-[10px] text-text-dim hover:text-text hover:border-accent/50 transition-colors backdrop-blur-sm"
      >
        <AlertCircle className="w-3 h-3" />
        Event Log
        {(criticalCount > 0 || warningCount > 0) && (
          <span className="flex items-center gap-1 ml-1">
            {criticalCount > 0 && <span className="px-1 py-0 rounded bg-error/20 text-error font-medium">{criticalCount}</span>}
            {warningCount > 0 && <span className="px-1 py-0 rounded bg-warning/20 text-warning font-medium">{warningCount}</span>}
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className="fixed z-20 w-[380px] max-h-[280px] bg-surface/95 border border-border rounded-lg shadow-2xl backdrop-blur-sm flex flex-col overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header — drag handle */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b border-border shrink-0 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-text-dim" />
          <AlertCircle className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text">Event Log</span>
          <span className="text-[9px] text-text-dim">{events.length} events</span>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-error/20 text-error">{criticalCount} critical</span>
          )}
          {warningCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-warning/20 text-warning">{warningCount} warning</span>
          )}
          <button onClick={clearEvents} className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors" title="Clear">
            <X className="w-3 h-3" />
          </button>
          <button onClick={() => setShowEventLog(false)} className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors" title="Minimize">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Event list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0"
      >
        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-dim">
            <Info className="w-6 h-6 mb-2 opacity-40" />
            <span className="text-[10px]">No events yet</span>
            <span className="text-[9px] opacity-60">Start a simulation to see events</span>
          </div>
        ) : (
          recentEvents.map(event => {
            const config = SEVERITY_CONFIG[event.severity]
            const Icon = config.icon
            const time = new Date(event.timestamp)
            const ts = `${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`

            return (
              <div
                key={event.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md border ${config.bg} ${config.border} transition-colors`}
              >
                <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-text-dim font-mono">{ts}</span>
                    {event.nodeName && (
                      <span className="text-[9px] font-medium text-text truncate max-w-[80px]">{event.nodeName}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-text leading-tight mt-0.5">{event.message}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
