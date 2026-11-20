import type {
    API,
    Checker,
    Program,
    Project,
    Snapshot,
} from "../api/sync/api.ts";

export type Severity = 0 | 1 | 2 | "off" | "warn" | "error";
export type RuleConfig = Severity | readonly [Severity, ...unknown[]];
export type Rules = Record<string, RuleConfig>;
export type NormalizedRules = Record<string, [0 | 1 | 2, ...unknown[]]>;
export type GlobalAccess = boolean | "off" | "readable" | "readonly" | "writable" | "writeable";
export type Globals = Record<string, GlobalAccess>;

export interface CompilerOptions {
    target?: number | undefined;
    strict?: boolean | undefined;
    noLib?: boolean | undefined;
    jsx?: number | undefined;
    lib?: string[] | undefined;
    alwaysStrict?: boolean | undefined;
    sourceType?: "module" | "script" | undefined;
}

export interface PluginSettings {
    currentDirectory: string;
    plugins: Record<string, string>;
    pluginResolveFrom?: Record<string, string> | undefined;
}

export interface LintRequest extends PluginSettings {
    kind: "lint";
    rules: Rules;
    globals?: Globals | undefined;
    files: readonly { fileName: string; }[];
    compilerOptions?: CompilerOptions | undefined;
}

export interface InspectPluginsRequest extends PluginSettings {
    kind: "inspectPlugins";
}

export type WorkRequest = LintRequest | InspectPluginsRequest;

export interface NativeAPIContext {
    api: API<boolean>;
    snapshot: Snapshot;
    project: Project;
    program?: Program | undefined;
    checker?: Checker | undefined;
    /** Compiler-resolved default and referenced libraries supplied by the native host. */
    defaultLibraries?: readonly string[] | undefined;
}

export interface Fix {
    range: [number, number];
    text: string;
}

export interface LintMessage {
    ruleId: string;
    severity: 1 | 2;
    message: string;
    messageId?: string | undefined;
    start: number;
    end: number;
    fix?: Fix | undefined;
    suggestions?: { desc: string; fix: Fix; }[] | undefined;
}

export interface FileTimings {
    /** Milliseconds spent materializing native source text, converting, analyzing scopes, and verifying. */
    decode: number;
    conversion: number;
    scope: number;
    verify: number;
}

export interface FileLintResult {
    fileName: string;
    messages: LintMessage[];
    timings: FileTimings;
    /** File/rule failures; messages from healthy rules remain available. */
    error?: string | undefined;
}

export interface BatchLintResult {
    files: FileLintResult[];
}

export interface InspectPluginsResult {
    ruleNames: string[];
    watchedFiles: string[];
}

export type WorkResult = BatchLintResult | InspectPluginsResult;
