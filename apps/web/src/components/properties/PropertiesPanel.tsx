import { useState, useRef, useEffect, useMemo } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { getComponentMeta } from '../../types/components'
import type { ComponentConfig, SimNode } from '../../types'
import type { Node } from '@xyflow/react'
import { X, Check, Image, Search, ChevronDown } from 'lucide-react'
import { ICONS, searchIcons } from '../../data/icons'
import type { IconDef } from '../../data/icons'

const NODE_COLORS = [
  { name: 'Indigo', value: 'var(--color-accent)' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Green', value: 'var(--color-success)' },
  { name: 'Yellow', value: 'var(--color-warning)' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: 'var(--color-error)' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Rose', value: '#f43f5e' },
]

export function PropertiesPanel({ setNodes }: { setNodes: (fn: (nodes: Node[]) => Node[]) => void }) {
  const store = useDiagramStore()
  const selectedNodeId = store.selectedNodeIds[0]
  const selectedNode = selectedNodeId ? store.nodes.find(n => n.id === selectedNodeId) : null

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelValue, setLabelValue] = useState('')
  const [editingTag, setEditingTag] = useState(false)
  const [tagValue, setTagValue] = useState('')

  // Icon search state (inline, no modal)
  const [iconSearch, setIconSearch] = useState('')
  const [iconDropdownOpen, setIconDropdownOpen] = useState(false)
  const iconSearchRef = useRef<HTMLDivElement>(null)

  // Cloud service dropdown state
  const [cloudServiceOpen, setCloudServiceOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (iconSearchRef.current && !iconSearchRef.current.contains(e.target as globalThis.Node)) {
        setIconDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return ICONS.slice(0, 50) // Show first 50 when no search
    return searchIcons(iconSearch).slice(0, 100) // Limit to 100 results
  }, [iconSearch])

  if (!selectedNode) return null

  const config = selectedNode.data.config as ComponentConfig
  const meta = getComponentMeta(selectedNode.data.componentType)
  const nodeColor = selectedNode.data.color || 'var(--color-accent)'
  const iconUrl = selectedNode.data.icon || null

  const updateConfig = (key: keyof ComponentConfig, value: number | string | boolean) => {
    store.updateNodeConfig(selectedNode.id, { [key]: value })
    // Also update ReactFlow nodes state to keep it in sync
    setNodes(currentNodes =>
      currentNodes.map(n =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, config: { ...(n.data.config as Record<string, any>), [key]: value } } }
          : n
      )
    )
  }

  const handleClose = () => {
    store.deselectAll()
  }

  const updateNodeData = (patch: Partial<SimNode['data']>) => {
    if (patch.label !== undefined) store.updateNodeLabel(selectedNode.id, patch.label)
    if (patch.tag !== undefined) store.updateNodeTag(selectedNode.id, patch.tag)
    if (patch.color !== undefined) store.updateNodeColor(selectedNode.id, patch.color)
    if (patch.icon !== undefined) store.updateNodeIcon(selectedNode.id, patch.icon)
    setNodes(currentNodes =>
      currentNodes.map(n =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, ...patch } }
          : n
      )
    )
  }

  const startLabelEdit = () => {
    setLabelValue(selectedNode.data.label)
    setEditingLabel(true)
  }

  const saveLabel = () => {
    if (labelValue.trim()) {
      updateNodeData({ label: labelValue.trim() })
    }
    setEditingLabel(false)
  }

  const startTagEdit = () => {
    setTagValue(selectedNode.data.tag || '')
    setEditingTag(true)
  }

  const saveTag = () => {
    updateNodeData({ tag: tagValue.trim() })
    setEditingTag(false)
  }

  const selectIcon = (icon: IconDef | null) => {
    updateNodeData({ icon: icon ? icon.url : undefined })
    setIconDropdownOpen(false)
    setIconSearch('')
  }

  return (
    <div className="w-64 bg-surface border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider">Properties</h2>
        <button
          onClick={handleClose}
          className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Identity section: Label, Tag, Color, Icon */}
        <div className="px-3 py-3 border-b border-border space-y-3">
          {/* Label */}
          <div>
            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Label</label>
            {editingLabel ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  autoFocus
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(); if (e.key === 'Escape') setEditingLabel(false) }}
                  className="flex-1 text-xs text-text bg-bg border border-accent rounded px-1.5 py-1 outline-none"
                />
                <button onClick={saveLabel} className="p-1 rounded hover:bg-surface-hover text-success"><Check className="w-3 h-3" /></button>
              </div>
            ) : (
              <div onClick={startLabelEdit} className="text-sm font-semibold text-text mt-0.5 cursor-pointer hover:text-accent transition-colors truncate" title="Click to edit">
                {selectedNode.data.label}
              </div>
            )}
          </div>

          {/* Tag */}
          <div>
            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Tag</label>
            {editingTag ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  autoFocus
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTag(); if (e.key === 'Escape') setEditingTag(false) }}
                  placeholder="e.g. primary, replica, v2"
                  className="flex-1 text-xs text-text bg-bg border border-accent rounded px-1.5 py-1 outline-none"
                />
                <button onClick={saveTag} className="p-1 rounded hover:bg-surface-hover text-success"><Check className="w-3 h-3" /></button>
              </div>
            ) : (
              <div onClick={startTagEdit} className="mt-0.5">
                {selectedNode.data.tag ? (
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium cursor-pointer"
                    style={{ backgroundColor: nodeColor + '20', color: nodeColor }}
                  >
                    {selectedNode.data.tag}
                  </span>
                ) : (
                  <span className="text-[11px] text-text-dim cursor-pointer hover:text-text transition-colors">+ Add tag</span>
                )}
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Color</label>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                {/* Native color picker input (hidden, triggered by swatch click) */}
                <div className="relative shrink-0">
                  <input
                    type="color"
                    value={nodeColor}
                    onChange={(e) => updateNodeData({ color: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-8 h-8 rounded-md border-2 border-border hover:border-accent/50 transition-colors cursor-pointer"
                    style={{ backgroundColor: nodeColor }}
                  />
                </div>
                {/* Hex input */}
                <input
                  type="text"
                  value={nodeColor}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                      updateNodeData({ color: val })
                    }
                  }}
                  onBlur={(e) => {
                    if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      e.target.value = nodeColor
                    }
                  }}
                  className="flex-1 text-[10px] text-text font-mono bg-bg border border-border rounded px-2 py-1.5 outline-none focus:border-accent transition-colors"
                  placeholder="#6366f1"
                  maxLength={7}
                />
                {/* Reset to default */}
                <button
                  onClick={() => updateNodeData({ color: undefined })}
                  className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
                  title="Reset to default"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {/* Preset color swatches */}
              <div className="mt-2 grid grid-cols-6 gap-1.5 p-2 rounded-lg border border-border bg-bg/50">
                {NODE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => updateNodeData({ color: c.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${c.value === nodeColor ? 'border-text scale-110 ring-1 ring-text/30' : 'border-transparent hover:border-text-dim'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Icon — inline searchable dropdown */}
          <div ref={iconSearchRef} className="relative">
            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Icon</label>
            <div className="mt-1">
              <button
                onClick={() => setIconDropdownOpen(!iconDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-border hover:border-accent/50 transition-colors w-full"
              >
                {iconUrl ? (
                  <img src={iconUrl} alt="" className="w-4 h-4" />
                ) : (
                  <Image className="w-4 h-4 text-text-dim" />
                )}
                <span className="text-[10px] text-text flex-1 text-left truncate">{iconUrl ? 'Change icon' : 'Select icon'}</span>
                <ChevronDown className="w-3 h-3 text-text-dim" />
              </button>

              {iconDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden" style={{ maxHeight: '280px' }}>
                  {/* Search input */}
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-dim" />
                      <input
                        autoFocus
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        placeholder="Search icons..."
                        className="w-full bg-bg border border-border rounded pl-7 pr-6 py-1.5 text-[10px] text-text placeholder-text-dim outline-none focus:border-accent transition-colors"
                      />
                      {iconSearch && (
                        <button
                          onClick={() => setIconSearch('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-hover text-text-dim"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    {iconSearch && (
                      <div className="text-[9px] text-text-dim mt-1 px-1">{filteredIcons.length} found</div>
                    )}
                  </div>

                  {/* Icon list */}
                  <div className="overflow-y-auto p-1.5" style={{ maxHeight: '200px' }}>
                    {filteredIcons.length === 0 ? (
                      <div className="text-center py-4 text-text-dim text-[10px]">No icons match "{iconSearch}"</div>
                    ) : (
                      <div className="grid grid-cols-7 gap-1">
                        {/* Clear icon option */}
                        <button
                          onClick={() => selectIcon(null)}
                          className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-all hover:border-accent/50 hover:bg-surface-hover ${
                            !iconUrl ? 'border-accent bg-accent/10' : 'border-transparent'
                          }`}
                          title="No icon"
                        >
                          <div className="w-5 h-5 rounded bg-surface-hover flex items-center justify-center">
                            <X className="w-3 h-3 text-text-dim" />
                          </div>
                        </button>
                        {filteredIcons.map(icon => (
                          <button
                            key={icon.id}
                            onClick={() => selectIcon(icon)}
                            className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-all hover:border-accent/50 hover:bg-surface-hover ${
                              iconUrl === icon.url ? 'border-accent bg-accent/10' : 'border-transparent'
                            }`}
                            title={icon.name}
                          >
                            <img src={icon.url} alt={icon.name} className="w-5 h-5" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Component info */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-base">{meta?.icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-text-dim">{meta?.category}</div>
            </div>
          </div>
          {meta && <p className="text-[9px] text-text-dim mt-1 leading-relaxed">{meta.description}</p>}
          
          {/* Cloud Provider selector */}
          <div className="mt-2.5">
            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Cloud Provider</label>
            <div className="flex gap-1 mt-1">
              {(['aws', 'azure', 'gcp', 'oss'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    store.updateCloudProvider(selectedNodeId, p)
                    setNodes(currentNodes =>
                      currentNodes.map(n =>
                        n.id === selectedNodeId
                          ? { ...n, data: { ...n.data, cloudProvider: p, cloudService: undefined } }
                          : n
                      )
                    )
                  }}
                  className={`flex-1 px-2 py-1 rounded text-[9px] font-medium transition-colors capitalize ${
                    (selectedNode.data.cloudProvider || 'aws') === p
                      ? 'bg-accent text-text border border-accent'
                      : 'bg-bg text-text-dim border border-border hover:border-accent/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            
            {/* Cloud Service Selector Dropdown */}
            {meta && (
              <div className="mt-2">
                <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Cloud Service</label>
                <div className="relative mt-1">
                  <div className="relative">
                    <button
                      onClick={() => setCloudServiceOpen(!cloudServiceOpen)}
                      className="w-full px-2 py-1.5 rounded bg-bg border border-border text-[9px] text-text flex items-center justify-between hover:border-accent/50 transition-colors"
                    >
                      <span className="truncate pr-6">
                        {selectedNode.data.cloudService || meta.cloudEquivalents?.[(selectedNode.data.cloudProvider || 'aws') as keyof typeof meta.cloudEquivalents]?.split(',')[0]?.trim() || 'Select service'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-text-dim shrink-0 ${cloudServiceOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {cloudServiceOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                        {meta.cloudEquivalents?.[(selectedNode.data.cloudProvider || 'aws') as keyof typeof meta.cloudEquivalents]?.split(',').map((s: string) => {
                          const service = s.trim()
                          return (
                            <button
                              key={service}
                              onClick={() => {
                                store.updateCloudProvider(selectedNodeId, selectedNode.data.cloudProvider || 'aws')
                                setNodes(currentNodes =>
                                  currentNodes.map(n =>
                                    n.id === selectedNodeId
                                      ? { ...n, data: { ...n.data, cloudService: service } }
                                      : n
                                  )
                                )
                                setCloudServiceOpen(false)
                              }}
                              className={`w-full px-3 py-2 text-[10px] text-left hover:bg-surface-hover transition-colors ${selectedNode.data.cloudService === service ? 'text-accent bg-accent/10' : 'text-text'}`}
                            >
                              {service}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              selectedNode.data.status === 'running' ? 'bg-success' :
              selectedNode.data.status === 'degraded' ? 'bg-warning' :
              selectedNode.data.status === 'failed' ? 'bg-error' : 'bg-text-dim'
            }`} />
            <span className="text-xs text-text capitalize">{selectedNode.data.status}</span>
          </div>
        </div>

        {/* Live metrics */}
        {selectedNode.data.metrics && (
          <div className="px-3 py-3 border-b border-border">
            <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Live Metrics</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-text-dim">RPS</span><span className="text-text font-mono">{selectedNode.data.metrics.currentRps.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-text-dim">Avg Latency</span><span className="text-text font-mono">{selectedNode.data.metrics.avgLatency.toFixed(1)}ms</span></div>
              <div className="flex justify-between"><span className="text-text-dim">P99 Latency</span><span className="text-text font-mono">{selectedNode.data.metrics.p99Latency.toFixed(1)}ms</span></div>
              <div className="flex justify-between"><span className="text-text-dim">Error Rate</span><span className={`font-mono ${selectedNode.data.metrics.errorRate > 0.05 ? 'text-error' : 'text-success'}`}>{(selectedNode.data.metrics.errorRate * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-text-dim">Utilization</span><span className={`font-mono ${selectedNode.data.metrics.utilization > 0.8 ? 'text-warning' : 'text-text'}`}>{(selectedNode.data.metrics.utilization * 100).toFixed(0)}%</span></div>
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="px-3 py-3">
          <div className="text-[10px] font-semibold text-text-dim uppercase tracking-widest mb-2">Configuration</div>
          <div className="space-y-3">
            {/* Common fields */}
            <ConfigSlider label="Max RPS" value={config.maxRps} min={100} max={100000} step={100} onChange={v => updateConfig('maxRps', v)} />
            <ConfigSlider label="P50 Latency" value={config.latencyP50} min={1} max={500} step={1} unit="ms" onChange={v => updateConfig('latencyP50', v)} />
            <ConfigSlider label="P95 Latency" value={config.latencyP95} min={1} max={2000} step={1} unit="ms" onChange={v => updateConfig('latencyP95', v)} />
            <ConfigSlider label="P99 Latency" value={config.latencyP99} min={1} max={5000} step={1} unit="ms" onChange={v => updateConfig('latencyP99', v)} />
            <ConfigSlider label="Conn. Limit" value={config.connectionLimit} min={10} max={100000} step={10} onChange={v => updateConfig('connectionLimit', v)} />
            <ConfigSlider label="Failure Rate" value={config.failureRate} min={0} max={0.5} step={0.001} unit="%" onChange={v => updateConfig('failureRate', v)} isPercent />

            {/* Cache-specific */}
            {config.cacheHitRatio !== undefined && (
              <>
                <ConfigSlider label="Cache Hit Ratio" value={config.cacheHitRatio} min={0} max={1} step={0.01} unit="%" onChange={v => updateConfig('cacheHitRatio', v)} isPercent />
                {config.cacheTtlSeconds !== undefined && <ConfigSlider label="Cache TTL" value={config.cacheTtlSeconds} min={10} max={3600} step={10} unit="s" onChange={v => updateConfig('cacheTtlSeconds', v)} />}
                {config.maxMemoryMb !== undefined && <ConfigSlider label="Max Memory" value={config.maxMemoryMb} min={64} max={131072} step={64} unit="MB" onChange={v => updateConfig('maxMemoryMb', v)} />}
              </>
            )}

            {/* Database-specific */}
            {config.replicationFactor !== undefined && (
              <>
                <ConfigSlider label="Replication Factor" value={config.replicationFactor} min={1} max={7} step={1} onChange={v => updateConfig('replicationFactor', v)} />
                {config.readReplicas !== undefined && <ConfigSlider label="Read Replicas" value={config.readReplicas} min={0} max={15} step={1} onChange={v => updateConfig('readReplicas', v)} />}
                {config.partitionCount !== undefined && <ConfigSlider label="Partitions" value={config.partitionCount} min={1} max={1000} step={1} onChange={v => updateConfig('partitionCount', v)} />}
                {config.storageGb !== undefined && <ConfigSlider label="Storage" value={config.storageGb} min={10} max={16384} step={10} unit="GB" onChange={v => updateConfig('storageGb', v)} />}
                {config.iops !== undefined && <ConfigSlider label="IOPS" value={config.iops} min={100} max={80000} step={100} onChange={v => updateConfig('iops', v)} />}
                {config.writeConsistency !== undefined && (
                  <ConfigSelect label="Write Consistency" value={config.writeConsistency} options={[
                    { value: 'strong', label: 'Strong' },
                    { value: 'eventual', label: 'Eventual' },
                    { value: 'session', label: 'Session' },
                  ]} onChange={v => updateConfig('writeConsistency', v as 'strong' | 'eventual' | 'session')} />
                )}
              </>
            )}

            {/* Queue/Messaging-specific */}
            {config.messageRetentionHours !== undefined && (
              <>
                <ConfigSlider label="Retention" value={config.messageRetentionHours} min={1} max={720} step={1} unit="h" onChange={v => updateConfig('messageRetentionHours', v)} />
                {config.maxMessageSizeKb !== undefined && <ConfigSlider label="Max Message Size" value={config.maxMessageSizeKb} min={1} max={10240} step={1} unit="KB" onChange={v => updateConfig('maxMessageSizeKb', v)} />}
                {config.consumerCount !== undefined && <ConfigSlider label="Consumers" value={config.consumerCount} min={1} max={100} step={1} onChange={v => updateConfig('consumerCount', v)} />}
                {config.deliveryGuarantee !== undefined && (
                  <ConfigSelect label="Delivery" value={config.deliveryGuarantee} options={[
                    { value: 'at-most-once', label: 'At Most Once' },
                    { value: 'at-least-once', label: 'At Least Once' },
                    { value: 'exactly-once', label: 'Exactly Once' },
                  ]} onChange={v => updateConfig('deliveryGuarantee', v as 'at-most-once' | 'at-least-once' | 'exactly-once')} />
                )}
              </>
            )}

            {/* Load Balancer-specific */}
            {config.algorithm !== undefined && (
              <>
                <ConfigSelect label="Algorithm" value={config.algorithm} options={[
                  { value: 'round-robin', label: 'Round Robin' },
                  { value: 'least-connections', label: 'Least Connections' },
                  { value: 'ip-hash', label: 'IP Hash' },
                  { value: 'weighted', label: 'Weighted' },
                ]} onChange={v => updateConfig('algorithm', v as 'round-robin' | 'least-connections' | 'ip-hash' | 'weighted')} />
                {config.healthCheckInterval !== undefined && <ConfigSlider label="Health Check" value={config.healthCheckInterval} min={5} max={60} step={5} unit="s" onChange={v => updateConfig('healthCheckInterval', v)} />}
                {config.sslTermination !== undefined && (
                  <ConfigToggle label="SSL Termination" value={config.sslTermination} onChange={v => updateConfig('sslTermination', v)} />
                )}
              </>
            )}

            {/* Compute-specific (App Server, Container) */}
            {config.autoScale !== undefined && (
              <>
                <ConfigToggle label="Auto Scale" value={config.autoScale} onChange={v => updateConfig('autoScale', v)} />
                {config.minInstances !== undefined && <ConfigSlider label="Min Instances" value={config.minInstances} min={1} max={100} step={1} onChange={v => updateConfig('minInstances', v)} />}
                {config.maxInstances !== undefined && <ConfigSlider label="Max Instances" value={config.maxInstances} min={1} max={500} step={1} onChange={v => updateConfig('maxInstances', v)} />}
                {config.cpuCores !== undefined && <ConfigSlider label="CPU Cores" value={config.cpuCores} min={1} max={128} step={1} onChange={v => updateConfig('cpuCores', v)} />}
                {config.memoryGb !== undefined && <ConfigSlider label="Memory" value={config.memoryGb} min={1} max={1024} step={1} unit="GB" onChange={v => updateConfig('memoryGb', v)} />}
              </>
            )}

            {/* Serverless-specific */}
            {config.timeoutMs !== undefined && (
              <>
                <ConfigSlider label="Timeout" value={config.timeoutMs} min={1000} max={900000} step={1000} unit="ms" onChange={v => updateConfig('timeoutMs', v)} />
                {config.concurrency !== undefined && <ConfigSlider label="Concurrency" value={config.concurrency} min={1} max={10000} step={1} onChange={v => updateConfig('concurrency', v)} />}
                {config.coldStartMs !== undefined && <ConfigSlider label="Cold Start" value={config.coldStartMs} min={0} max={5000} step={50} unit="ms" onChange={v => updateConfig('coldStartMs', v)} />}
              </>
            )}

            {/* CDN-specific */}
            {config.edgeLocations !== undefined && (
              <>
                <ConfigSlider label="Edge Locations" value={config.edgeLocations} min={10} max={500} step={10} onChange={v => updateConfig('edgeLocations', v)} />
                {config.cacheTtlMinutes !== undefined && <ConfigSlider label="Cache TTL" value={config.cacheTtlMinutes} min={1} max={1440} step={1} unit="min" onChange={v => updateConfig('cacheTtlMinutes', v)} />}
                {config.originShield !== undefined && (
                  <ConfigToggle label="Origin Shield" value={config.originShield} onChange={v => updateConfig('originShield', v)} />
                )}
              </>
            )}

            {/* Storage-specific */}
            {config.storageClass !== undefined && (
              <>
                <ConfigSelect label="Storage Class" value={config.storageClass} options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'infrequent', label: 'Infrequent Access' },
                  { value: 'archive', label: 'Archive' },
                  { value: 'glacier', label: 'Glacier' },
                ]} onChange={v => updateConfig('storageClass', v as 'standard' | 'infrequent' | 'archive' | 'glacier')} />
                {config.versioning !== undefined && (
                  <ConfigToggle label="Versioning" value={config.versioning} onChange={v => updateConfig('versioning', v)} />
                )}
                {config.encryption !== undefined && (
                  <ConfigToggle label="Encryption" value={config.encryption} onChange={v => updateConfig('encryption', v)} />
                )}
              </>
            )}

            {/* External/Third-party-specific */}
            {config.rateLimitRps !== undefined && (
              <>
                <ConfigSlider label="Rate Limit" value={config.rateLimitRps} min={1} max={100000} step={1} unit="rps" onChange={v => updateConfig('rateLimitRps', v)} />
                {config.timeout !== undefined && <ConfigSlider label="Timeout" value={config.timeout} min={100} max={60000} step={100} unit="ms" onChange={v => updateConfig('timeout', v)} />}
                {config.retryCount !== undefined && <ConfigSlider label="Retries" value={config.retryCount} min={0} max={10} step={1} onChange={v => updateConfig('retryCount', v)} />}
                {config.circuitBreaker !== undefined && (
                  <ConfigToggle label="Circuit Breaker" value={config.circuitBreaker} onChange={v => updateConfig('circuitBreaker', v)} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Config Select Dropdown ──
function ConfigSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-text-dim">{label}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg border border-border rounded text-[10px] text-text px-2 py-1.5 outline-none focus:border-accent transition-colors cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Config Toggle ──
function ConfigToggle({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-text-dim">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-border'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'left-4.5 translate-x-0' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

// ── Config Slider ──
function ConfigSlider({ label, value, min, max, step, unit, onChange, isPercent }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void; isPercent?: boolean
}) {
  const [localValue, setLocalValue] = useState(String(value))

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(String(isPercent ? +(value * 100).toFixed(1) : value))
  }, [value, isPercent])

  const displayValue = isPercent ? (value * 100).toFixed(1) : value.toLocaleString()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    const num = parseFloat(raw)
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num))
      onChange(isPercent ? clamped / 100 : clamped)
    }
  }

  const handleInputBlur = () => {
    const num = parseFloat(localValue)
    if (isNaN(num)) {
      setLocalValue(String(isPercent ? +(value * 100).toFixed(1) : value))
    } else {
      const clamped = Math.min(max, Math.max(min, num))
      setLocalValue(String(isPercent ? +clamped.toFixed(1) : clamped))
      onChange(isPercent ? clamped / 100 : clamped)
    }
  }

  const handleStep = (direction: 1 | -1) => {
    const num = parseFloat(localValue) || 0
    const newVal = Math.min(max, Math.max(min, num + direction * step))
    const formatted = isPercent ? +(newVal / 100).toFixed(1) : newVal
    setLocalValue(String(formatted))
    onChange(isPercent ? newVal / 100 : newVal)
  }

  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-text-dim">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Numeric input with stepper */}
        <div className="flex items-center border border-border rounded-md bg-bg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            className="px-1.5 py-1 text-text-dim hover:text-text hover:bg-surface-hover transition-colors text-[10px] font-bold"
          >
            ▾
          </button>
          <input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleInputBlur() }}
            className="w-16 text-center text-[10px] text-text font-mono bg-transparent outline-none border-x border-border py-1"
          />
          <button
            type="button"
            onClick={() => handleStep(1)}
            className="px-1.5 py-1 text-text-dim hover:text-text hover:bg-surface-hover transition-colors text-[10px] font-bold"
          >
            ▴
          </button>
          {unit && <span className="text-[9px] text-text-dim pr-1.5">{unit}</span>}
        </div>
        {/* Slider */}
        <input
          type="range"
          min={isPercent ? min * 100 : min}
          max={isPercent ? max * 100 : max}
          step={isPercent ? step * 100 : step}
          value={isPercent ? value * 100 : value}
          onChange={(e) => onChange(isPercent ? Number(e.target.value) / 100 : Number(e.target.value))}
          className="flex-1 h-1 accent-accent cursor-pointer min-w-0"
        />
      </div>
    </div>
  )
}
