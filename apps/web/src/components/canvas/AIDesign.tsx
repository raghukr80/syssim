import { useState } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { getComponentMeta } from '../../types/components'
import type { ComponentType } from '../../types'
import { X, Copy, Check, Sparkles, Upload, Wand2 } from 'lucide-react'

// ─── Generate AI Prompt from current canvas ──
export function generateAIPrompt(nodes: any[], edges: any[]): string {
  if (nodes.length === 0) {
    return `Design a system architecture for me. Please describe the requirements and I'll generate the JSON structure.

The JSON format should be:
{
  "nodes": [
    { "id": "node_1", "type": "web_server", "label": "Web Server", "x": 100, "y": 100 }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2" }
  ]
}

Available component types:
${getAvailableTypes().join(', ')}

Please respond with ONLY the JSON, no additional text.`
  }

  const nodeDesc = nodes.map(n => {
    const meta = getComponentMeta(n.data.componentType as ComponentType)
    return `  - ${n.data.label || n.data.componentType} (${n.data.componentType})${n.data.config ? ` with config: ${JSON.stringify(n.data.config)}` : ''}`
  }).join('\n')

  const edgeDesc = edges.map(e => {
    const src = nodes.find(n => n.id === e.source)
    const tgt = nodes.find(n => n.id === e.target)
    return `  - ${src?.data.label || e.source} → ${tgt?.data.label || e.target}`
  }).join('\n')

  return `I have the following system architecture:

Nodes:
${nodeDesc}

Connections:
${edgeDesc}

Please analyze this architecture and suggest improvements. Generate a JSON response with the following format:

{
  "nodes": [
    { "id": "node_1", "type": "web_server", "label": "Web Server", "x": 100, "y": 100, "config": {...} }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2", "data": { "label": "", "protocol": "HTTP" } }
  ]
}

Available component types:
${getAvailableTypes().join(', ')}

Rules:
- Keep the same node IDs unless adding new nodes
- Use x/y coordinates to position nodes logically (left-to-right flow)
- Each node needs: id, type, label, x, y
- Each edge needs: id, source, target
- Use component-specific configs where appropriate

Please respond with ONLY the JSON, no additional text.`
}

function getAvailableTypes(): string[] {
  return [
    'load_balancer', 'api_gateway', 'api_management', 'cdn', 'dns', 'waf', 'nat_gateway', 'service_mesh',
    'web_server', 'microservice', 'serverless', 'container_cluster', 'graphql', 'websocket', 'worker', 'cron_job',
    'database', 'cache', 'search_engine', 'graph_database', 'time_series_db', 'document_store', 'key_value_store', 'data_warehouse', 'data_lake',
    'message_queue', 'event_bus', 'notification_service', 'email_service', 'sms_service',
    'identity_provider', 'secrets_manager', 'certificate_manager', 'ddos_protection',
    'monitoring', 'logging', 'tracing', 'alerting',
    'ml_model', 'ml_training', 'feature_store', 'vector_search', 'recommendation_engine',
    'third_party_api', 'client', 'custom_component'
  ]
}

// ─── AI Design Modal ──
export function AIDesignModal({ onClose }: { onClose: () => void }) {
  const store = useDiagramStore()
  const [tab, setTab] = useState<'generate' | 'import'>('generate')
  const [copied, setCopied] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [loading, setLoading] = useState(false)

  const prompt = generateAIPrompt(store.nodes, store.edges)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImport = () => {
    setImportError('')
    setLoading(true)

    try {
      const data = JSON.parse(importJson)

      // Validate structure
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid JSON: "nodes" array is required')
      }
      if (!data.edges || !Array.isArray(data.edges)) {
        throw new Error('Invalid JSON: "edges" array is required')
      }

      // Validate nodes
      const validTypes = getAvailableTypes()
      for (const node of data.nodes) {
        if (!node.id) throw new Error('Each node must have an "id"')
        if (!node.type || !validTypes.includes(node.type)) {
          throw new Error(`Invalid node type: ${node.type}. Valid types: ${validTypes.join(', ')}`)
        }
        if (!node.label) node.label = node.type
        if (typeof node.x !== 'number') node.x = Math.random() * 500
        if (typeof node.y !== 'number') node.y = Math.random() * 400
      }

      // Validate edges
      const nodeIds = new Set(data.nodes.map((n: any) => n.id))
      for (const edge of data.edges) {
        if (!edge.id) throw new Error('Each edge must have an "id"')
        if (!edge.source || !nodeIds.has(edge.source)) {
          throw new Error(`Edge ${edge.id} references unknown source: ${edge.source}`)
        }
        if (!edge.target || !nodeIds.has(edge.target)) {
          throw new Error(`Edge ${edge.id} references unknown target: ${edge.target}`)
        }
      }

      // Load into store
      const newNodes = data.nodes.map((n: any) => ({
        id: String(n.id),
        type: 'simComponent',
        position: { x: n.x, y: n.y },
        data: {
          componentType: n.type,
          label: n.label || n.type,
          icon: getComponentMeta(n.type as ComponentType)?.icon || '⚙️',
          config: n.config || {},
          metrics: { currentRps: 0, avgLatency: 0, p99Latency: 0, errorRate: 0, utilization: 0 },
          status: 'idle',
        },
      }))

      const newEdges = data.edges.map((e: any) => ({
        id: String(e.id),
        source: String(e.source),
        target: String(e.target),
        type: 'smoothstep',
        animated: false,
        style: { stroke: 'var(--color-accent)', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', color: 'var(--color-accent)', width: 15, height: 15 },
        data: { label: e.data?.label || '', protocol: e.data?.protocol || 'HTTP', bandwidthMbps: 1000, latencyMs: 0, encrypted: false, showArrow: true },
      }))

      store.loadDiagram(newNodes, newEdges)
      onClose()
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-[640px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-semibold text-text">AI System Design</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('generate')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
              tab === 'generate' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-dim hover:text-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
            Generate Prompt
          </button>
          <button
            onClick={() => setTab('import')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
              tab === 'import' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-dim hover:text-text'
            }`}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1.5" />
            Import from AI
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {tab === 'generate' ? (
            <div className="space-y-4">
              <p className="text-[11px] text-text-dim leading-relaxed">
                Copy the prompt below and paste it into any AI chatbot (ChatGPT, Claude, Gemini, etc.) to generate or improve your system architecture. The AI will respond with a JSON structure you can import back.
              </p>
              <div className="relative">
                <pre className="text-[10px] text-text bg-bg border border-border rounded-lg p-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {prompt}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-surface border border-border text-[9px] text-text-dim hover:text-text hover:border-accent/50 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                <p className="text-[10px] text-info font-medium mb-1">How to use:</p>
                <ol className="text-[10px] text-text-dim space-y-0.5 list-decimal list-inside">
                  <li>Copy the prompt above</li>
                  <li>Paste into ChatGPT, Claude, or any AI chatbot</li>
                  <li>Ask the AI to generate or improve the architecture</li>
                  <li>Copy the JSON response</li>
                  <li>Go to "Import from AI" tab and paste the JSON</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[11px] text-text-dim leading-relaxed">
                Paste the JSON output from any AI chatbot below. The JSON should contain a "nodes" array and an "edges" array describing your system architecture.
              </p>
              <textarea
                value={importJson}
                onChange={e => { setImportJson(e.target.value); setImportError('') }}
                placeholder={`{\n  "nodes": [\n    { "id": "node_1", "type": "web_server", "label": "Web Server", "x": 100, "y": 100 }\n  ],\n  "edges": [\n    { "id": "edge_1", "source": "node_1", "target": "node_2" }\n  ]\n}`}
                className="w-full h-48 text-[10px] text-text bg-bg border border-border rounded-lg p-3 outline-none focus:border-accent resize-none font-mono"
              />
              {importError && (
                <div className="text-[10px] text-error bg-error/5 border border-error/20 rounded-lg p-2">
                  {importError}
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!importJson.trim() || loading}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                  !importJson.trim() || loading
                    ? 'bg-bg text-text-dim cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent/90'
                }`}
              >
                {loading ? 'Importing...' : 'Import & Load Design'}
              </button>
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                <p className="text-[10px] text-warning font-medium mb-1">Expected JSON format:</p>
                <pre className="text-[9px] text-text-dim font-mono leading-relaxed whitespace-pre-wrap">{`{
  "nodes": [
    { "id": "node_1", "type": "web_server", "label": "Web Server", "x": 100, "y": 100 },
    { "id": "node_2", "type": "database", "label": "Database", "x": 400, "y": 100 }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_1", "target": "node_2" }
  ]
}`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
