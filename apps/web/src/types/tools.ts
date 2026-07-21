// ============================================================
// Tools System Types
// ============================================================

export type ToolCategory = 'all' | 'planning' | 'architecture' | 'performance' | 'data' | 'reliability' | 'other';

export type ToolDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ToolInput {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'checkbox' | 'multiselect' | 'slider';
  unit?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number | boolean;
  required?: boolean;
  helpText?: string;
  validate?: (value: any) => string | null;
}

export interface ToolOutput {
  key: string;
  label: string;
  type: 'number' | 'text' | 'formula' | 'chart' | 'list' | 'comparison';
  unit?: string;
  format?: (value: any) => string;
  description?: string;
}

export interface ToolFormula {
  description: string;
  latex?: string;
  compute: (inputs: Record<string, any>) => Record<string, any>;
}

export interface ToolExample {
  name: string;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
  description?: string;
}

export interface ToolReference {
  title: string;
  url: string;
  type: 'article' | 'paper' | 'doc' | 'video';
}

export interface Tool {
  id: string;
  name: string;
  shortName: string;
  description: string;
  longDescription?: string;
  category: ToolCategory;
  difficulty: ToolDifficulty;
  estimatedTimeMinutes: number;
  icon: string;
  color: string;
  
  // Inputs/Outputs
  inputs: ToolInput[];
  outputs: ToolOutput[];
  
  // Logic
  formula?: ToolFormula;
  compute?: (inputs: Record<string, any>) => Record<string, any>;
  
  // Examples
  examples?: ToolExample[];
  
  // References
  references?: ToolReference[];
  
  // Metadata
  tags?: string[];
  version?: string;
  author?: string;
  
  // UI
  layout?: 'single' | 'split' | 'tabs';
  showFormula?: boolean;
  showChart?: boolean;
  chartConfig?: any;
}

export interface ToolCategoryConfig {
  key: ToolCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
  order: number;
}

export const TOOL_CATEGORIES: ToolCategoryConfig[] = [
  {
    key: 'planning',
    label: 'Planning & Analysis',
    icon: '📊',
    color: 'text-blue-400',
    description: 'Capacity planning, cost estimation, system analysis',
    order: 1,
  },
  {
    key: 'architecture',
    label: 'Architecture & Design',
    icon: '🏗️',
    color: 'text-purple-400',
    description: 'System architecture, API design, decomposition',
    order: 2,
  },
  {
    key: 'performance',
    label: 'Performance & Optimization',
    icon: '⚡',
    color: 'text-yellow-400',
    description: 'Latency, throughput, caching, optimization',
    order: 3,
  },
  {
    key: 'data',
    label: 'Data & Storage',
    icon: '🗄️',
    color: 'text-green-400',
    description: 'Database selection, sizing, sharding, replication',
    order: 4,
  },
  {
    key: 'reliability',
    label: 'Reliability & Resilience',
    icon: '🛡️',
    color: 'text-red-400',
    description: 'Availability, failure analysis, recovery',
    order: 5,
  },
  {
    key: 'other',
    label: 'Other Tools',
    icon: '🔧',
    color: 'text-gray-400',
    description: 'Guides, references, miscellaneous',
    order: 6,
  },
];

export function getCategoryConfig(category: ToolCategory): ToolCategoryConfig {
  return TOOL_CATEGORIES.find(c => c.key === category) || TOOL_CATEGORIES[5];
}