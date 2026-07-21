import { useState, useEffect, useCallback } from 'react';
import { ToolsPage } from './ToolsPage';
import { ToolPage } from './ToolPage';

// ─── Simple hash-based router for tools ──────────────────────
// URL hash: #tools = tools index, #tools/:toolId = specific tool

type Page = { page: 'tools' } | { page: 'tool'; toolId: string };

function readHash(): Page | null {
  const hash = window.location.hash.slice(1); // remove '#'
  if (!hash.startsWith('tools')) return null;

  // #tools/system-design-calculator
  const parts = hash.split('/');
  if (parts.length >= 2) {
    const toolId = parts.slice(1).join('/');
    return { page: 'tool', toolId };
  }
  return { page: 'tools' };
}

export function ToolRouter({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState<Page | null>(() => readHash());

  // Listen for hash changes
  useEffect(() => {
    const handler = () => setPage(readHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Navigate to a tool page
  const navigateToTool = useCallback((toolId: string) => {
    window.location.hash = `tools/${toolId}`;
  }, []);

  // Navigate back to tools index
  const navigateToIndex = useCallback(() => {
    window.location.hash = 'tools';
  }, []);

  if (!page) return null;

  if (page.page === 'tool') {
    return <ToolPage toolId={page.toolId} onBack={navigateToIndex} />;
  }

  return <ToolsPage onBack={onBack} />;
}