import { ReactFlow, Background, BackgroundVariant, Controls, useNodesState, useEdgesState, addEdge, type Node, type Edge, type OnConnect, type NodeTypes, Panel, type OnNodesChange, type OnEdgesChange, ConnectionMode } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useRef, useEffect, useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { getComponentMeta } from '../../types/components'
import type { SimNode, SimEdge, ComponentType } from '../../types'
import { ComponentNode } from './ComponentNode'
import { ParticleCanvas } from './ParticleCanvas'
import { ComponentPalette } from '../palette/ComponentPalette'
import { Toolbar } from '../toolbar/Toolbar'
import { PropertiesPanel } from '../properties/PropertiesPanel'
import { EdgePropertiesPanel } from '../properties/EdgePropertiesPanel'
import { StatusBar } from '../metrics/StatusBar'
import { MetricsPanel } from '../metrics/MetricsPanel'
import { EventLog } from '../metrics/EventLog'
import { ReportModal } from '../metrics/ReportModal'
import { SimulationControls } from '../toolbar/SimulationControls'
import { CanvasToolbar } from './CanvasToolbar'
import { useLayoutZones, LayoutZonesRenderer } from './LayoutZones'

const nodeTypes: NodeTypes = {
  simComponent: ComponentNode,
}

let rfIdCounter = 0
function genRfId(): string {
  return `rf_${++rfIdCounter}`
}

export default function SimulatorCanvas() {
  const store = useDiagramStore()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<Edge>([])

  // Track whether we're currently syncing from store (to avoid echo loops)
  const syncingFromStore = useRef(false)

  // ── Initial sync: store → ReactFlow (for blueprints loaded on mount) ──
  useEffect(() => {
    if (store.nodes.length > 0 && nodes.length === 0) {
      syncingFromStore.current = true
      setNodes(store.nodes.map(n => ({
        id: n.id,
        type: 'simComponent' as const,
        position: n.position,
        data: { ...n.data },
      })))
      setEdges(store.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep' as const,
        animated: false,
        style: { stroke: 'var(--color-accent)', strokeWidth: 2 },
        markerEnd: (e.data as Record<string, unknown>)?.showArrow !== false ? {
          type: 'arrowclosed' as const,
          color: 'var(--color-accent)',
          width: 15,
          height: 15,
        } : undefined,
        label: e.data?.label || '',
        data: { ...e.data, label: e.data?.label || '' },
      })))
      syncingFromStore.current = false
    }
  }, [store.nodes, store.edges, nodes.length, setNodes, setEdges])

  // ── Simulation tick: store → ReactFlow (metrics/status only) ──
  // Uses a polling interval to push simulation results into ReactFlow nodes.
  // Only updates existing nodes — never adds or removes.
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncingFromStore.current) return
      if (store.simState !== 'running') return

      setNodes(currentNodes => {
        let changed = false
        const updated = currentNodes.map(cfNode => {
          const storeNode = store.nodes.find(sn => sn.id === cfNode.id)
          if (!storeNode) return cfNode
          const storeMetrics = JSON.stringify(storeNode.data.metrics)
          const cfMetrics = JSON.stringify((cfNode.data as any).metrics)
          const storeStatus = storeNode.data.status
          const cfStatus = (cfNode.data as any).status
          if (storeMetrics !== cfMetrics || storeStatus !== cfStatus) {
            changed = true
            return { ...cfNode, data: { ...cfNode.data, metrics: storeNode.data.metrics, status: storeNode.data.status } }
          }
          return cfNode
        })
        return changed ? updated : currentNodes
      })
    }, 300)
    return () => clearInterval(interval)
  }, [store.nodes, store.simState, setNodes])

  // ── User actions: ReactFlow → store (one-way, no echo) ──
  // After any user-driven change, copy the full node/edge list to the store.
  // The syncingFromStore flag prevents the store→ReactFlow effect from firing.
  const syncToStore = useCallback(() => {
    syncingFromStore.current = true
    const simNodes: SimNode[] = nodes.map(n => ({
      id: n.id,
      type: 'simComponent' as const,
      position: n.position,
      data: n.data as SimNode['data'],
    }))
    const simEdges: SimEdge[] = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'simConnection' as const,
      data: { label: e.label as string | undefined },
    }))
    store.setNodes(simNodes)
    store.setEdges(simEdges)
    // Clear flag after a tick so the store→ReactFlow effect can resume
    setTimeout(() => { syncingFromStore.current = false }, 50)
  }, [nodes, edges, store])

  // ── ReactFlow change handlers ──
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChangeRaw(changes)
      if (syncingFromStore.current) return
      // Use rAF to let ReactFlow process the change first, then sync to store
      requestAnimationFrame(syncToStore)
    },
    [onNodesChangeRaw, syncToStore]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeRaw(changes)
      if (syncingFromStore.current) return
      requestAnimationFrame(syncToStore)
    },
    [onEdgesChangeRaw, syncToStore]
  )

  // ── Trace mode: click nodes to build path ──
  const isTraceMode = useDiagramStore(s => s.traceMode)
  const tracePath = useDiagramStore(s => s.tracePath)
  const traceEdgeNumbers = useDiagramStore(s => s.traceEdgeNumbers)
  const addTraceNode = useDiagramStore(s => s.addTraceNode)
  const clearTrace = useDiagramStore(s => s.clearTrace)

  const onNodeClickHandler = useCallback((_e: React.MouseEvent, node: Node) => {
    if (isTraceMode) {
      addTraceNode(node.id)
    }
  }, [isTraceMode, addTraceNode])

  // ── Edge animated state ──
  useEffect(() => {
    setEdges((currentEdges: Edge[]) =>
      currentEdges.map((e: Edge) => {
        const showArrow = (e.data as Record<string, unknown>)?.showArrow !== false
        const traceNum = traceEdgeNumbers[e.id]
        const isTraced = traceNum !== undefined
        const style: Record<string, any> = {
          ...((e.style as Record<string, any>) || {}),
          stroke: isTraced ? 'var(--color-success)' : store.simState === 'running' ? 'var(--color-accent)' : 'var(--color-border)',
          strokeWidth: isTraced ? 3 : store.simState === 'running' ? 2 : 1.5,
        }
        const markerEnd = showArrow ? {
          type: 'arrowclosed',
          color: isTraced ? 'var(--color-success)' : store.simState === 'running' ? 'var(--color-accent)' : 'var(--color-border)',
          width: isTraced ? 18 : 15,
          height: isTraced ? 18 : 15,
        } : undefined
        const label = isTraced ? ` ${traceNum} ` : (e.data?.label || '')
        const data: Record<string, any> = { ...e.data, label }
        return { ...e, animated: store.simState === 'running' || isTraced, style, markerEnd, label, data } as Edge
      })
    )
  }, [store.simState, setEdges, traceEdgeNumbers])

  // ── Selection sync ──
  const lastSelectionRef = useRef<{ ids: string[]; edgeIds: string[] }>({ ids: [], edgeIds: [] })
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      const newIds = selNodes.map(n => n.id)
      const newEdgeIds = selEdges.map(e => e.id)
      const last = lastSelectionRef.current
      const idsChanged = newIds.length !== last.ids.length || newIds.some((id, i) => id !== last.ids[i])
      const edgeIdsChanged = newEdgeIds.length !== last.edgeIds.length || newEdgeIds.some((id, i) => id !== last.edgeIds[i])
      if (idsChanged || edgeIdsChanged) {
        lastSelectionRef.current = { ids: newIds, edgeIds: newEdgeIds }
        store.setSelectedNodes(newIds)
        store.setSelectedEdges(newEdgeIds)
      }
    },
    [store]
  )

  // ── Edge double-click to edit label ──
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [editingPos, setEditingPos] = useState({ x: 0, y: 0 })
  const editInputRef = useRef<HTMLInputElement>(null)

  const onEdgeDoubleClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    const rect = (_e.target as HTMLElement).getBoundingClientRect()
    setEditingEdgeId(edge.id)
    setEditingLabel((edge.data as Record<string, unknown>)?.label as string || '')
    setEditingPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }, [])

  useEffect(() => {
    if (editingEdgeId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingEdgeId])

  const commitLabel = useCallback(() => {
    if (!editingEdgeId) return
    const newLabel = editingLabel.trim()
    setEdges(eds => eds.map(ed =>
      ed.id === editingEdgeId
        ? { ...ed, label: newLabel, data: { ...ed.data, label: newLabel } }
        : ed
    ))
    const updatedEdges = store.edges.map((se: any) =>
      se.id === editingEdgeId ? { ...se, data: { ...se.data, label: newLabel } } : se
    )
    store.setEdges(updatedEdges)
    setEditingEdgeId(null)
    setEditingLabel('')
  }, [editingEdgeId, editingLabel, setEdges, store])

  // ── Track connection direction manually ──
  // We use onConnectStart to remember which node the user grabbed,
  // so we can set source/target correctly regardless of handle type.
  const connectingNodeRef = useRef<string | null>(null)

  const onConnectStart = useCallback((_: any) => {
    connectingNodeRef.current = _.nodeId
  }, [])

  const onConnectEnd = useCallback(() => {
    connectingNodeRef.current = null
  }, [])

  // ── Connect handler ──
  const onConnect: OnConnect = useCallback(
    (params) => {
      // Use the node the user actually grabbed as the source
      const userSource = connectingNodeRef.current
      let source = params.source!
      let target = params.target!
      let sourceHandle = params.sourceHandle
      let targetHandle = params.targetHandle

      if (userSource && userSource !== source) {
        // ReactFlow swapped source/target — reverse them back
        const tmpNode = source
        source = target
        target = tmpNode
        const tmpH = sourceHandle
        sourceHandle = targetHandle
        targetHandle = tmpH
      }

      const edge: Edge = {
        id: `edge_${source}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: store.simState === 'running',
        style: { stroke: 'var(--color-accent)', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: 'var(--color-accent)',
          width: 15,
          height: 15,
        },
        data: {
          label: '',
          protocol: 'HTTP',
          bandwidthMbps: 1000,
          latencyMs: 0,
          encrypted: false,
          showArrow: true,
        },
      }
      setEdges(eds => addEdge(edge, eds))
      requestAnimationFrame(syncToStore)
    },
    [setEdges, store.simState, syncToStore]
  )

  // ── Drag and drop handler ──
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const componentType = e.dataTransfer.getData('application/syssim-component') as ComponentType
      if (!componentType) return

      const meta = getComponentMeta(componentType)
      if (!meta) return

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = {
        x: e.clientX - bounds.left - 75,
        y: e.clientY - bounds.top - 25,
      }

      const newNode: Node = {
        id: genRfId(),
        type: 'simComponent',
        position,
        data: {
          componentType,
          label: meta.label,
          icon: meta.icon,
          config: { ...meta.defaultConfig },
          status: 'idle',
        },
      }

      setNodes(nds => [...nds, newNode])
      requestAnimationFrame(syncToStore)
    },
    [setNodes, syncToStore]
  )

  // ── Deselect (close properties panel) ──
  useEffect(() => {
    if (store.deselectVersion > 0) {
      setNodes(currentNodes => currentNodes.map(n => ({ ...n, selected: false })))
      setEdges(currentEdges => currentEdges.map(e => ({ ...e, selected: false })))
      lastSelectionRef.current = { ids: [], edgeIds: [] }
    }
  }, [store.deselectVersion, setNodes, setEdges])

  // ── Clear diagram ──
  useEffect(() => {
    if (store.clearVersion > 0) {
      setNodes([])
      setEdges([])
      lastSelectionRef.current = { ids: [], edgeIds: [] }
    }
  }, [store.clearVersion, setNodes, setEdges])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedNodeIds.length > 0) {
        e.preventDefault()
        const toRemove = [...store.selectedNodeIds]
        store.removeNodes(toRemove)
        setNodes(nds => nds.filter(n => !toRemove.includes(n.id)))
        setEdges(eds => eds.filter(e => !toRemove.includes(e.source) && !toRemove.includes(e.target)))
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.undo()
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        store.redo()
      }

      if (e.key === 'Escape') {
        store.setSelectedNodes([])
        store.setSelectedEdges([])
      }

      // Delete selected edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedEdges = store.selectedEdgeIds
        if (selectedEdges.length > 0) {
          e.preventDefault()
          setEdges(eds => eds.filter(e => !selectedEdges.includes(e.id)))
          store.setSelectedEdges([])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store, setNodes, setEdges])

  // ── Edge selection state ──
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  useEffect(() => {
    if (store.selectedNodeIds.length > 0) {
      setSelectedEdge(null)
    }
  }, [store.selectedNodeIds])

  useEffect(() => {
    if (store.selectedEdgeIds.length > 0) {
      const edgeId = store.selectedEdgeIds[0]
      const edge = edges.find(e => e.id === edgeId)
      if (edge) {
        setSelectedEdge(edge)
        setEdges(eds => eds.map(e => ({ ...e, selected: e.id === edgeId })))
      }
    } else {
      setSelectedEdge(null)
    }
  }, [store.selectedEdgeIds, edges, setEdges])

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(eds => eds.filter(e => e.id !== edgeId))
    store.setSelectedEdges([])
    setSelectedEdge(null)
  }

  const handleCloseEdgePanel = () => {
    store.setSelectedEdges([])
    setSelectedEdge(null)
  }

  // ── Layout Zones ──
  const layoutZones = useLayoutZones()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <ComponentPalette />

      <div className="flex flex-col flex-1 min-w-0">
        <Toolbar onAddZone={layoutZones.addZone} />
        <div ref={reactFlowWrapper} className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onNodeClick={onNodeClickHandler}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.1}
            maxZoom={3}
            proOptions={{ hideAttribution: true }}
            className="dot-grid"
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
              style: { stroke: 'var(--color-accent)', strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--color-border)" />
            <Controls
              position="bottom-right"
              showZoom={true}
              showFitView={true}
              showInteractive={false}
              className="!bg-surface !border !border-border !rounded-lg !shadow-lg [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-text [&>button:hover]:!bg-surface-hover"
            />
            <Panel position="top-right">
              <SimulationControls />
            </Panel>
          </ReactFlow>

          <ParticleCanvas />

          {/* Layout Zones — absolutely positioned overlay with pointer-events pass-through */}
          <LayoutZonesRenderer
            zones={layoutZones.zones}
            selectedZoneId={layoutZones.selectedZoneId}
            onSelect={layoutZones.setSelectedZoneId}
            onUpdate={layoutZones.updateZone}
            onRename={layoutZones.renameZone}
            onDelete={layoutZones.deleteZone}
          />
        </div>

        <StatusBar />
      </div>

      {store.selectedNodeIds.length > 0 && <PropertiesPanel setNodes={setNodes} />}

      {selectedEdge && !store.selectedNodeIds.length && (
        <EdgePropertiesPanel
          edge={selectedEdge}
          onDelete={handleDeleteEdge}
          onClose={handleCloseEdgePanel}
        />
      )}

      {store.showMetrics && <MetricsPanel />}

      <EventLog />
      <ReportModal />
      <CanvasToolbar />

      {/* Inline edge label editor */}
      {editingEdgeId && (
        <div
          className="fixed z-[100] pointer-events-auto"
          style={{ left: editingPos.x, top: editingPos.y, transform: 'translate(-50%, -50%)' }}
        >
          <input
            ref={editInputRef}
            value={editingLabel}
            onChange={e => setEditingLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => {
              if (e.key === 'Enter') commitLabel()
              if (e.key === 'Escape') { setEditingEdgeId(null); setEditingLabel('') }
            }}
            placeholder="Label"
            className="px-2 py-1 text-[11px] text-text bg-surface border border-accent rounded shadow-lg outline-none w-32 text-center"
            maxLength={40}
          />
        </div>
      )}
    </div>
  )
}
