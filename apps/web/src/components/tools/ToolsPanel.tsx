import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Star, Clock, ChevronRight } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { TOOL_REGISTRY } from './toolRegistry';
import { TOOL_CATEGORIES, getCategoryConfig } from "@/types/tools"
import type { Tool, ToolCategory } from "@/types/tools"

// ─── Difficulty Badge ───────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: Tool['difficulty'] }) {
  const styles = {
    beginner: 'bg-success/15 text-success',
    intermediate: 'bg-accent/15 text-accent',
    advanced: 'bg-warning/15 text-warning',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium uppercase tracking-wider ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
}

// ─── Tool Card ─────────────────────────────────────────────
function ToolCard({ tool, onSelect, isFavorite, onToggleFavorite }: {
  tool: Tool;
  onSelect: (tool: Tool) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, toolId: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(tool)}
      className="w-full text-left p-3 rounded-lg border border-border hover:border-accent/50 bg-surface hover:bg-surface-hover transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="text-xl shrink-0 mt-0.5">{tool.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold text-text group-hover:text-accent transition-colors truncate">
              {tool.name}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              <DifficultyBadge difficulty={tool.difficulty} />
              <button
                onClick={(e) => onToggleFavorite(e, tool.id)}
                className={`p-0.5 rounded transition-colors ${isFavorite ? 'text-yellow-400' : 'text-text-dim hover:text-yellow-400'}`}
              >
                <Star className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
          <p className="text-[9px] text-text-dim mt-0.5 line-clamp-2">{tool.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[8px] text-text-dim/60 bg-bg/50 px-1.5 py-0.5 rounded">
              {tool.estimatedTimeMinutes} min
            </span>
            <span className="text-[8px] text-text-dim/60 bg-bg/50 px-1.5 py-0.5 rounded">
              {tool.inputs?.length || 0} inputs
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main Tools Panel ──────────────────────────────────────
export function ToolsPanel({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');
  const [showRecent, setShowRecent] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { recentTools, favoriteTools, toggleFavorite, openTool } = useToolsStore();

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Filter tools
  const filteredTools = useMemo(() => {
    let result = TOOL_REGISTRY;

    // Category filter
    if (category !== 'all') {
      result = result.filter(t => t.category === category);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Recent
    if (showRecent) {
      result = result.filter(t => recentTools.includes(t.id));
    }

    // Favorites
    if (showFavorites) {
      result = result.filter(t => favoriteTools.includes(t.id));
    }

    return result;
  }, [category, search, showRecent, showFavorites, recentTools, favoriteTools]);

  // Group by category
  const groupedTools = useMemo(() => {
    if (showRecent || showFavorites || search.trim()) {
      return [{ category: 'all' as ToolCategory, tools: filteredTools }];
    }
    return TOOL_CATEGORIES.map(cat => ({
      category: cat.key,
      tools: filteredTools.filter(t => t.category === cat.key),
    })).filter(group => group.tools.length > 0);
  }, [filteredTools, showRecent, showFavorites, search]);

  const handleSelectTool = (tool: Tool) => {
    openTool(tool.id);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-[850px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <span className="text-lg">🛠️</span>
              System Design Tools
              <span className="text-[10px] text-text-dim bg-bg/50 px-1.5 py-0.5 rounded">{TOOL_REGISTRY.length} tools</span>
            </h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowRecent(false);
                setShowFavorites(false);
              }}
              placeholder="Search tools... (e.g., 'capacity', 'database', 'cache')"
              className="w-full pl-9 pr-4 py-2 text-xs text-text bg-bg border border-border rounded-lg placeholder-text-dim focus:outline-none focus:border-accent transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-hover text-text-dim"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="px-5 py-2 border-b border-border shrink-0 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => { setShowRecent(false); setShowFavorites(false); setCategory('all'); }}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              category === 'all' && !showRecent && !showFavorites
                ? 'bg-accent text-text'
                : 'text-text-dim hover:text-text hover:bg-surface-hover'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setShowRecent(!showRecent); setShowFavorites(false); setCategory('all'); }}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              showRecent ? 'bg-accent text-text' : 'text-text-dim hover:text-text hover:bg-surface-hover'
            }`}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Recent
          </button>
          <button
            onClick={() => { setShowFavorites(!showFavorites); setShowRecent(false); setCategory('all'); }}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
              showFavorites ? 'bg-accent text-text' : 'text-text-dim hover:text-text hover:bg-surface-hover'
            }`}
          >
            <Star className="w-3 h-3 inline mr-1" />
            Favorites
          </button>
          <div className="w-px bg-border shrink-0 mx-1" />
          {TOOL_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setShowRecent(false); setShowFavorites(false); }}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                category === cat.key && !showRecent && !showFavorites
                  ? 'bg-accent text-text'
                  : 'text-text-dim hover:text-text hover:bg-surface-hover'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-xs text-text-dim">No tools found matching "{search}"</p>
            </div>
          ) : (
            groupedTools.map((group) => {
              const catConfig = getCategoryConfig(group.category);
              return (
                <div key={group.category}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">
                      {group.category === 'all' ? (
                        showRecent ? '🕐 Recent Tools' :
                        showFavorites ? '⭐ Favorites' :
                        `🔍 Search Results (${group.tools.length})`
                      ) : (
                        `${catConfig.icon} ${catConfig.label}`
                      )}
                    </span>
                    <span className="text-[9px] text-text-dim bg-bg/50 px-1.5 py-0.5 rounded">
                      {group.tools.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.tools.map(tool => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onSelect={handleSelectTool}
                        isFavorite={favoriteTools.includes(tool.id)}
                        onToggleFavorite={(e, toolId) => {
                          e.stopPropagation();
                          toggleFavorite(toolId);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border shrink-0 flex items-center justify-between text-[9px] text-text-dim">
          <span>Tip: Type to search, ⌘K/Ctrl+K to open</span>
          <span>{filteredTools.length} of {TOOL_REGISTRY.length} tools</span>
        </div>
      </div>
    </div>,
    document.body
  );
}