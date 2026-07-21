import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Copy, Download, RotateCcw, Star, X, ChevronRight } from 'lucide-react';
import { useToolsStore } from '../../stores/toolsStore';
import { TOOL_REGISTRY } from './toolRegistry';
import { getCategoryConfig } from "@/types/tools"
import type { Tool, ToolInput } from '@/types/tools';

// ─── Input Component ──────────────────────────────────────
function ToolInputField({ input, value, onChange }: {
  input: ToolInput;
  value: any;
  onChange: (value: any) => void;
}) {
  if (input.type === 'number') {
    return (
      <div>
        <label className="text-[10px] font-medium text-text-dim mb-1 block">
          {input.label} {input.unit && <span className="text-text-dim/60">({input.unit})</span>}
        </label>
        <input
          type="number"
          value={value ?? input.defaultValue ?? ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={input.min}
          max={input.max}
          step={input.step || 1}
          className="w-full px-2 py-1.5 text-xs text-text bg-bg border border-border rounded focus:outline-none focus:border-accent transition-colors"
        />
        {input.helpText && <p className="text-[8px] text-text-dim/60 mt-0.5">{input.helpText}</p>}
      </div>
    );
  }

  if (input.type === 'select') {
    return (
      <div>
        <label className="text-[10px] font-medium text-text-dim mb-1 block">{input.label}</label>
        <select
          value={value ?? input.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-xs text-text bg-bg border border-border rounded focus:outline-none focus:border-accent transition-colors"
        >
          {input.options?.map((opt: { value: string; label: string }) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[10px] font-medium text-text-dim mb-1 block">{input.label}</label>
      <input
        type="text"
        value={value ?? input.defaultValue ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={input.placeholder}
        className="w-full px-2 py-1.5 text-xs text-text bg-bg border border-border rounded focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

// ─── Result Component ─────────────────────────────────────
function ToolResult({ label, value, unit }: {
  label: string;
  value: any;
  unit?: string;
}) {
  const formatted = typeof value === 'number'
    ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : String(value);

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
      <span className="text-[10px] text-text-dim">{label}</span>
      <span className="text-[11px] font-mono text-text font-medium">
        {formatted} {unit && <span className="text-text-dim text-[9px]">{unit}</span>}
      </span>
    </div>
  );
}

// ─── Main Tool Modal ──────────────────────────────────────
export function ToolModal({ onClose }: { onClose: () => void }) {
  const { openToolId, saveToolResult, getToolHistory, favoriteTools, toggleFavorite } = useToolsStore();
  const tool = TOOL_REGISTRY.find(t => t.id === openToolId);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize inputs with defaults
  useEffect(() => {
    if (!tool) return;
    const defaults: Record<string, any> = {};
    tool.inputs.forEach(input => {
      defaults[input.key] = input.defaultValue ?? '';
    });
    setInputs(defaults);
  }, [tool]);

  // Compute results
  const outputs = useMemo(() => {
    if (!tool?.compute) return {};
    return tool.compute(inputs);
  }, [tool, inputs]);

  const updateInput = (key: string, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const resetInputs = () => {
    if (!tool) return;
    const defaults: Record<string, any> = {};
    tool.inputs.forEach(input => {
      defaults[input.key] = input.defaultValue ?? '';
    });
    setInputs(defaults);
  };

  const loadExample = (example: any) => {
    setInputs(example.inputs);
  };

  const copyResults = useCallback(() => {
    if (!tool) return;
    const data = { tool: tool.name, inputs, outputs, timestamp: new Date().toISOString() };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    saveToolResult(tool.id, inputs, outputs);
  }, [tool, inputs, outputs, saveToolResult]);

  const downloadResults = useCallback(() => {
    if (!tool) return;
    const data = { tool: tool.name, inputs, outputs, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
    saveToolResult(tool.id, inputs, outputs);
  }, [tool, inputs, outputs, saveToolResult]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!tool) return null;

  const history = getToolHistory(tool.id);
  const isFavorite = favoriteTools.includes(tool.id);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-[900px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{tool.icon}</span>
              <div>
                <h2 className="text-xs font-semibold text-text">{tool.name}</h2>
                <p className="text-[9px] text-text-dim">{tool.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(tool.id)}
              className={`p-1.5 rounded transition-colors ${isFavorite ? 'text-yellow-400' : 'text-text-dim hover:text-yellow-400'}`}
            >
              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={copyResults}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={downloadResults}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Split Inputs | Outputs */}
        <div className="flex-1 flex overflow-hidden">
          {/* Inputs Panel */}
          <div className="w-[380px] shrink-0 border-r border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">Inputs</h3>
              <button onClick={resetInputs} className="text-[9px] text-text-dim hover:text-accent flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
            <div className="space-y-3">
              {tool.inputs.map(input => (
                <ToolInputField
                  key={input.key}
                  input={input}
                  value={inputs[input.key]}
                  onChange={(v) => updateInput(input.key, v)}
                />
              ))}
            </div>

            {/* Examples */}
            {tool.examples && tool.examples.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <h3 className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-2">Examples</h3>
                <div className="space-y-1">
                  {tool.examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => loadExample(ex)}
                      className="w-full text-left px-2 py-1.5 rounded text-[9px] text-text-dim hover:text-text hover:bg-surface-hover transition-colors flex items-center justify-between"
                    >
                      <span>{ex.name}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-2 flex items-center gap-1 hover:text-text"
                >
                  History ({history.length})
                </button>
                {showHistory && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {history.slice(0, 5).map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setInputs(h.inputs)}
                        className="w-full text-left px-2 py-1.5 rounded text-[8px] text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span>{Object.values(h.inputs).slice(0, 3).join(' / ')}</span>
                          <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outputs Panel */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-3">Results</h3>
            {Object.keys(outputs).length > 0 ? (
              <div className="space-y-0.5">
                {tool.outputs.map(output => (
                  <ToolResult
                    key={output.key}
                    label={output.label}
                    value={outputs[output.key]}
                    unit={output.unit}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-dim text-[10px]">
                Configure inputs to see results
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border shrink-0 flex items-center justify-between text-[8px] text-text-dim">
          <span>⏱️ ~{tool.estimatedTimeMinutes} min · 📊 {tool.difficulty}</span>
          <span>SysSim Tools · {tool.inputs?.length || 0} inputs · {tool.outputs?.length || 0} outputs</span>
        </div>
      </div>
    </div>,
    document.body
  );
}