import { useState, useEffect, useCallback } from 'react';
import { Wrench, X } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { ToolsPanel } from './ToolsPanel';
import { ToolModal } from './ToolModal';

export function ToolsMenu() {
  const [panelOpen, setPanelOpen] = useState(false);
  const { openToolId, closeTool, openTool } = useToolsStore();

  // Keyboard shortcut: Ctrl/Cmd + K to toggle tools panel
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (openToolId) {
        closeTool();
      } else {
        setPanelOpen(prev => !prev);
      }
    }
  }, [openToolId, closeTool]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Tools Button */}
      <button
        onClick={() => setPanelOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                   text-text-dim hover:text-text hover:bg-surface-hover border border-border 
                   hover:border-accent/50 transition-all"
        title="System Design Tools (⌘K)"
      >
        <Wrench className="w-3.5 h-3.5" />
        <span>Tools</span>
      </button>

      {/* Tools Panel (library browser) */}
      {panelOpen && !openToolId && (
        <ToolsPanel onClose={() => setPanelOpen(false)} />
      )}

      {/* Active Tool Modal */}
      {openToolId && (
        <ToolModal onClose={closeTool} />
      )}
    </>
  );
}
