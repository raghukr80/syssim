import { useState, useRef, useEffect } from 'react'
import { useDiagramStore } from '../../stores/diagramStore'
import { Download, Upload, Undo2, Redo2, Activity, Eraser, LayoutGrid, FolderPlus, FileJson, FileImage, FileText } from 'lucide-react'
import { BlueprintPanel } from './BlueprintPanel'
import { CostPanel } from './CostPanel'
import { ToolsMenu } from '../tools/ToolsMenu'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

export function Toolbar({ onAddZone }: { onAddZone: () => void }) {
  const store = useDiagramStore()
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Close dropdown when clicking outside
  const exportMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showExportMenu) return
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    // Use click event instead of mousedown to allow dropdown buttons to fire
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showExportMenu])

  const getCanvasElement = () => {
    return document.querySelector('.react-flow') as HTMLElement | null
  }

  const handleExport = () => {
    const json = store.exportDiagram()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'syssim-diagram.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPNG = async () => {
    const el = getCanvasElement()
    if (!el) return
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: 'var(--color-bg)',
        quality: 1,
        pixelRatio: 2,
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'syssim-diagram.png'
      a.click()
    } catch (err) {
      console.error('PNG export failed:', err)
    }
  }

  const handleExportPDF = async () => {
    const el = getCanvasElement()
    if (!el) return
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: 'var(--color-bg)',
        quality: 1,
        pixelRatio: 2,
      })
      const img = new Image()
      img.src = dataUrl
      await new Promise(resolve => { img.onload = resolve })

      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width, img.height],
      })
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height)
      pdf.save('syssim-diagram.pdf')
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        store.importDiagram(reader.result as string)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="h-11 bg-surface border-b border-border flex items-center px-3 gap-1 shrink-0">
      {/* Logo + Editable Title */}
      <div className="flex items-center gap-2 mr-4">
        <Activity className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-text">SysSim</span>
        <span className="text-text-dim text-sm">·</span>
        <EditableTitle />
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Blueprints */}
      <BlueprintPanel />

      <div className="w-px h-5 bg-border mx-1" />

      {/* System Design Tools */}
      <ToolsMenu />

      <div className="w-px h-5 bg-border mx-1" />

      {/* File operations */}
      <button onClick={handleImport} className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors" title="Import">
        <Upload className="w-4 h-4" />
      </button>
      <div className="relative" ref={exportMenuRef}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
        {showExportMenu && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
            <button
              onClick={() => { handleExport(); setShowExportMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-text hover:bg-surface-hover transition-colors"
            >
              <FileJson className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={() => { handleExportPNG(); setShowExportMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-text hover:bg-surface-hover transition-colors"
            >
              <FileImage className="w-3.5 h-3.5" /> Export PNG
            </button>
            <button
              onClick={() => { handleExportPDF(); setShowExportMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] text-text hover:bg-surface-hover transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Undo/Redo */}
      <button onClick={() => store.undo()} className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors" title="Undo (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={() => store.redo()} className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors" title="Redo (Ctrl+Shift+Z)">
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Add Layout Zone */}
      <button
        onClick={onAddZone}
        className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
        title="Add Layout Zone"
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Clear Canvas & Auto Align */}
      <button
        onClick={() => store.clearDiagram()}
        className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
        title="Clear Canvas"
      >
        <Eraser className="w-4 h-4" />
      </button>
      <button
        onClick={() => store.autoAlign()}
        className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
        title="Auto Align Diagram"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      {/* Cost */}
      <CostPanel />

      {/* Theme toggle */}
      <button
        onClick={() => store.toggleTheme()}
        className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
        title={store.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {store.theme === 'dark' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Metrics toggle */}
      <button
        onClick={() => store.toggleMetrics()}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          store.showMetrics ? 'bg-accent text-white' : 'text-text-dim hover:text-text hover:bg-surface-hover'
        }`}
      >
        Metrics
      </button>
    </div>
  )
}

// ─── Editable Title ──
function EditableTitle() {
  const title = useDiagramStore(s => s.title)
  const setTitle = useDiagramStore(s => s.setTitle)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(title)
  }, [title])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== title) {
      setTitle(trimmed)
      document.title = `SysSim — ${trimmed}`
    } else {
      setDraft(title)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(title); setEditing(false) }
        }}
        className="text-sm text-text bg-transparent border-b border-accent outline-none px-0.5 py-0 w-48"
        placeholder="Untitled design"
        maxLength={60}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-sm text-text-dim hover:text-text transition-colors truncate max-w-[200px]"
      title="Click to rename"
    >
      {title || 'Untitled design'}
    </button>
  )
}
