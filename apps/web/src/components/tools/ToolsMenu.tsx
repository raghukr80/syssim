import { useEffect, useCallback } from 'react';
import { Wrench } from 'lucide-react';

export function ToolsMenu() {
  // Navigate to tools page (hash-based routing)
  const openTools = useCallback(() => {
    window.location.hash = 'tools';
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + K to open tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const hash = window.location.hash;
        if (hash.startsWith('#tools')) {
          // Already in tools, go back to canvas
          window.location.hash = '';
        } else {
          window.location.hash = 'tools';
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <button
      onClick={openTools}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                 text-text-dim hover:text-text hover:bg-surface-hover border border-border 
                 hover:border-accent/50 transition-all"
      title="System Design Tools (⌘K)"
    >
      <Wrench className="w-3.5 h-3.5" />
      <span>Tools</span>
    </button>
  );
}