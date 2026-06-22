/* tslint:disable */
/* eslint-disable */

/**
 * JavaScript-facing simulation controller
 */
export class SimController {
    free(): void;
    [Symbol.dispose](): void;
    addComponent(id: string, component_type: string, config_json: string): void;
    addConnection(source_id: string, target_id: string): void;
    getMetrics(): string;
    constructor();
    pause(): void;
    resume(): void;
    setInputRps(rps: number): void;
    setSpeed(multiplier: number): void;
    start(): void;
    step(): string;
    stop(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_simcontroller_free: (a: number, b: number) => void;
    readonly simcontroller_addComponent: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly simcontroller_addConnection: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly simcontroller_getMetrics: (a: number) => [number, number];
    readonly simcontroller_new: () => number;
    readonly simcontroller_pause: (a: number) => void;
    readonly simcontroller_resume: (a: number) => void;
    readonly simcontroller_setInputRps: (a: number, b: number) => void;
    readonly simcontroller_setSpeed: (a: number, b: number) => void;
    readonly simcontroller_start: (a: number) => void;
    readonly simcontroller_step: (a: number) => [number, number];
    readonly simcontroller_stop: (a: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
