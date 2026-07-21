import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Star, Clock, ChevronRight, Wrench } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { TOOL_REGISTRY } from '../../components/tools/toolRegistry';
import { TOOL_CATEGORIES, getCategoryConfig } from '../../types/tools';
import type { ToolCategory, Tool } from '../../types/tools';
import { ToolRouter } from './ToolRouter';

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

// ─── Tool Card ───────────────────────────────────────────────
function ToolCard({ tool }: { tool: Tool }) {
  const { openTool, addToRecent } = useToolsStore();

  const handleOpen = () => {
    addToRecent(tool.id);
    openTool(tool.id);
  };

  return (
    <button
      onClick={handleOpen}
      className="group w-full text-left bg-bg border border-border rounded-lg p-4 hover:border-accent/50 hover:bg-surface-hover transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{tool.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[11px] font-semibold text-text group-hover:text-accent transition-colors">{tool.name}</h3>
            <DifficultyBadge difficulty={tool.difficulty} />
          </div>
          <p className="text-[9px] text-text-dim leading-relaxed line-clamp-2">{tool.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[8px] text-text-dim/70 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              ~{tool.estimatedTimeMinutes} min
            </span>
            <span className="text-[8px] text-text-dim/70">·</span>
            <span className="text-[8px] text-text-dim/70">
              {tool.inputs.length} inputs · {tool.outputs.length} outputs
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-dim/40 group-hover:text-accent transition-colors shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── Category Section ────────────────────────────────────────
function CategorySection({ category, tools }: { category: ToolCategory; tools: Tool[] }) {
  const config = getCategoryConfig(category);
  if (tools.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{config.icon}</span>
        <h2 className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">{config.label}</h2>
        <span className="text-[8px] text-text-dim/50">({tools.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Tools Page ─────────────────────────────────────────
export function ToolsPage({ onBack }: { onBack: () => void }) {
  const { selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, recentTools, favoriteTools } = useToolsStore();

  // Filter tools by category and search
  const filteredTools = useMemo(() => {
    let tools = TOOL_REGISTRY;

    // Category filter
    if (selectedCategory !== 'all') {
      tools = tools.filter(t => t.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    return tools;
  }, [selectedCategory, searchQuery]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Tool[]> = {};
    filteredTools.forEach(tool => {
      if (!groups[tool.category]) groups[tool.category] = [];
      groups[tool.category].push(tool);
    });
    return groups;
  }, [filteredTools]);

  // Recent and favorite tools
  const recentToolObjects = useMemo(() => {
    return recentTools.map(id => TOOL_REGISTRY.find(t => t.id === id)).filter(Boolean) as Tool[];
  }, [recentTools]);

  const favoriteToolObjects = useMemo(() => {
    return favoriteTools.map(id => TOOL_REGISTRY.find(t => t.id === id)).filter(Boolean) as Tool[];
  }, [favoriteTools]);

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Header */}
      <div className="h-11 bg-surface border-b border-border flex items-center px-3 gap-2 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
          title="Back to Canvas"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Wrench className="w-3.5 h-3.5 text-accent" />
        <h1 className="text-xs font-semibold text-text">System Design Tools</h1>
        <span className="text-[9px] text-text-dim ml-1">({TOOL_REGISTRY.length} tools)</span>

        {/* Search */}
        <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-bg border border-border rounded-lg">
          <Search className="w-3 h-3 text-text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="bg-transparent text-[10px] text-text placeholder:text-text-dim/50 outline-none w-40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-dim hover:text-text">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tabs: All | Recent | Favorites */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${activeTab === 'all' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text'}`}
        >
          All Categories
        </button>
        {recentTools.length > 0 && (
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${activeTab === 'recent' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text'}`}
          >
            <Clock className="w-2.5 h-2.5 inline mr-1" />
            Recent ({recentTools.length})
          </button>
        )}
        {favoriteTools.length > 0 && (
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${activeTab === 'favorites' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text'}`}
          >
            <Star className="w-2.5 h-2.5 inline mr-1" />
            Favorites ({favoriteTools.length})
          </button>
        )}
      </div>

      {/* Category filter when on "All" tab */}
      {activeTab === 'all' && (
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto shrink-0">
          {TOOL_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? 'all' : cat.key)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.key ? 'bg-accent/20 text-accent' : 'bg-surface border border-border text-text-dim hover:text-text'}`}
            >
              <span>{cat.icon}</span>
              {cat.label.split(' & ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'recent' && (
          <div className="grid grid-cols-2 gap-2">
            {recentToolObjects.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="grid grid-cols-2 gap-2">
            {favoriteToolObjects.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {activeTab === 'all' && filteredTools.length === 0 && (
          <div className="text-center py-12 text-text-dim">
            <p className="text-[11px]">No tools found for "{searchQuery}"</p>
          </div>
        )}

        {activeTab === 'all' && filteredTools.length > 0 && (
          <div className="space-y-6">
            {Object.keys(grouped).sort().map(category => (
              <CategorySection
                key={category}
                category={category as ToolCategory}
                tools={grouped[category]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}