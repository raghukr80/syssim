import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tool, ToolCategory } from '@/types/tools';

interface ToolsState {
  // Tool state
  openToolId: string | null;
  openPanel: boolean;
  searchQuery: string;
  selectedCategory: ToolCategory | 'all';
  
  // History & favorites
  recentTools: string[]; // tool IDs, most recent first
  favoriteTools: string[]; // tool IDs
  toolHistory: Record<string, { inputs: Record<string, any>; outputs: Record<string, any>; timestamp: number }[]>;
  
  // Panel dimensions
  panelWidth: number;
  panelHeight: number;
  
  // Actions
  openTool: (toolId: string) => void;
  closeTool: () => void;
  togglePanel: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ToolCategory | 'all') => void;
  
  // History
  addToRecent: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
  saveToolResult: (toolId: string, inputs: Record<string, any>, outputs: Record<string, any>) => void;
  getToolHistory: (toolId: string) => { inputs: Record<string, any>; outputs: Record<string, any>; timestamp: number }[];
  
  // Panel
  setPanelDimensions: (width: number, height: number) => void;
}

const MAX_RECENT = 10;
const MAX_HISTORY_PER_TOOL = 20;

export const useToolsStore = create<ToolsState>()(
  persist(
    (set, get) => ({
      openToolId: null,
      openPanel: false,
      searchQuery: '',
      selectedCategory: 'all',
      recentTools: [],
      favoriteTools: [],
      toolHistory: {},
      panelWidth: 1000,
      panelHeight: 700,
      
      openTool: (toolId: string) => {
        set({ openToolId: toolId, openPanel: true });
        get().addToRecent(toolId);
      },
      
      closeTool: () => set({ openToolId: null, openPanel: false }),
      
      togglePanel: () => set({ openPanel: !get().openPanel }),
      
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      
      setSelectedCategory: (category: ToolCategory | 'all') => set({ selectedCategory: category }),
      
      addToRecent: (toolId: string) => {
        const recent = get().recentTools.filter(id => id !== toolId);
        set({ recentTools: [toolId, ...recent].slice(0, MAX_RECENT) });
      },
      
      toggleFavorite: (toolId: string) => {
        const favorites = get().favoriteTools;
        if (favorites.includes(toolId)) {
          set({ favoriteTools: favorites.filter(id => id !== toolId) });
        } else {
          set({ favoriteTools: [...favorites, toolId] });
        }
      },
      
      saveToolResult: (toolId: string, inputs: Record<string, any>, outputs: Record<string, any>) => {
        const history = get().toolHistory[toolId] || [];
        const newEntry = { inputs, outputs, timestamp: Date.now() };
        set({
          toolHistory: {
            ...get().toolHistory,
            [toolId]: [newEntry, ...history].slice(0, MAX_HISTORY_PER_TOOL),
          },
        });
      },
      
      getToolHistory: (toolId: string) => {
        return get().toolHistory[toolId] || [];
      },
      
      setPanelDimensions: (width: number, height: number) => set({ panelWidth: width, panelHeight: height }),
    }),
    {
      name: 'syssim-tools',
      partialize: (state) => ({
        recentTools: state.recentTools,
        favoriteTools: state.favoriteTools,
        toolHistory: state.toolHistory,
        panelWidth: state.panelWidth,
        panelHeight: state.panelHeight,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);