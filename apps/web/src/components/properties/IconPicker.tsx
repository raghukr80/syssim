import { useState, useMemo, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { ICONS, ICON_CATEGORIES, searchIcons, getIconsByCategory } from '../../data/icons'
import type { IconDef } from '../../data/icons'

interface IconPickerProps {
  currentIconUrl?: string
  onSelect: (icon: IconDef | null) => void
  onClose: () => void
}

export function IconPicker({ currentIconUrl, onSelect, onClose }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const gridRef = useRef<HTMLDivElement>(null)

  const filteredIcons = useMemo(() => {
    if (search.trim()) return searchIcons(search)
    return getIconsByCategory(category)
  }, [search, category])

  // Scroll to top when search or category changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = 0
    }
  }, [search, category])

  // If no icons found yet, show helpful message
  const noIcons = ICONS.length === 0
  const isSearching = search.trim().length > 0
  const searchResultCount = isSearching ? filteredIcons.length : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-text">Select Icon</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 1600+ icons by name, category..."
              className="w-full bg-bg border border-border rounded-lg pl-8 pr-16 py-2 text-xs text-text placeholder-text-dim outline-none focus:border-accent transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isSearching && (
                <>
                  <span className="text-[9px] text-text-dim">{searchResultCount} found</span>
                  <button
                    onClick={() => setSearch('')}
                    className="p-0.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-4 py-2 border-b border-border shrink-0">
          <div className="flex gap-1 flex-wrap">
            {ICON_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setCategory(cat.key); setSearch('') }}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  category === cat.key && !search
                    ? 'bg-accent text-white'
                    : 'text-text-dim hover:text-text hover:bg-surface-hover'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icon grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto p-3">
          {noIcons ? (
            <div className="text-center py-12 text-text-dim text-xs space-y-2">
              <div className="text-2xl">📁</div>
              <div className="font-medium">No icons found</div>
              <div className="text-[10px] max-w-xs mx-auto leading-relaxed">
                Add SVG files to <code className="bg-surface-hover px-1 rounded">public/icons/</code> folder organized by category:
                <br />aws/, azure/, gcp/, tech/, database/, etc.
              </div>
            </div>
          ) : filteredIcons.length === 0 ? (
            <div className="text-center py-8 text-text-dim text-xs">
              <div className="text-2xl mb-2">🔍</div>
              <div>No icons match "<span className="text-text">{search}</span>"</div>
              <div className="text-[9px] mt-1 opacity-60">Try a different search term or browse by category</div>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {filteredIcons.map(icon => (
                <button
                  key={icon.id}
                  onClick={() => onSelect(icon)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all hover:border-accent/50 hover:bg-surface-hover ${
                    currentIconUrl === icon.url
                      ? 'border-accent bg-accent/10'
                      : 'border-transparent'
                  }`}
                  title={`${icon.name} (${icon.category})`}
                >
                  <img
                    src={icon.url}
                    alt={icon.name}
                    className="w-6 h-6"
                    loading="lazy"
                  />
                  <span className="text-[7px] text-text-dim truncate w-full text-center leading-tight">{icon.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border shrink-0 flex items-center justify-between">
          <span className="text-[9px] text-text-dim">
            {noIcons ? '0 icons' : `${filteredIcons.length} icon${filteredIcons.length !== 1 ? 's' : ''}`}
          </span>
          {currentIconUrl && (
            <button
              onClick={() => onSelect(null)}
              className="text-[9px] text-error hover:text-error/80 transition-colors"
            >
              Remove custom icon
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
