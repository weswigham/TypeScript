import type {
    ESLint,
    Linter,
    Rule,
} from "eslint";
import {
    existsSync,
    statSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import {
    type CompilerOptions,
    type NormalizedRules,
    type PluginSettings,
} from "./types.ts";
import {
    record,
    string,
    strings,
} from "./validation.ts";

export interface LoadedPlugins {
    key: string;
    plugins: Record<string, ESLint.Plugin>;
    ruleNames: string[];
    watchedFiles: string[];
}

export interface LintConfiguration {
    currentDirectory: string;
    plugins: Record<string, ESLint.Plugin>;
    rules: Linter.RulesRecord;
    globals: Linter.Globals;
    compilerOptions: CompilerOptions | undefined;
}

const pluginCache = new Map<string, Promise<LoadedPlugins>>();
const configurationCache = new Map<string, Promise<LintConfiguration>>();
const cacheLimit = 32;
const validatedOptions = new WeakMap<Rule.RuleModule, Map<string, readonly unknown[]>>();

function assertJSON(value: unknown, description: string, seen = new Set<object>()): void {
    if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return;
    if (typeof value !== "object") throw new Error(`${description} must contain only JSON values (not ${typeof value})`);
    if (seen.has(value)) throw new Error(`${description} must not contain circular values`);
    seen.add(value);
    for (const child of Object.values(value)) assertJSON(child, description, seen);
    seen.delete(value);
}

export function normalizeRules(value: unknown, description = "Rules"): NormalizedRules {
    const result: NormalizedRules = Object.create(null) as NormalizedRules;
    for (const [id, config] of Object.entries(record(value, description))) {
        const entry: unknown[] = Array.isArray(config) ? config : [config];
        const severity = entry[0];
        const level = severity === "off" ? 0 : severity === "warn" ? 1 : severity === "error" ? 2 : severity;
        if (level !== 0 && level !== 1 && level !== 2) throw new Error(`Invalid severity for rule "${id}"`);
        assertJSON(entry, `Options for rule "${id}"`);
        result[id] = [level, ...entry.slice(1)];
    }
    return result;
}

function cache<T>(map: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
    const existing = map.get(key);
    if (existing) return existing;
    if (map.size >= cacheLimit) map.delete(map.keys().next().value!);
    const result = load();
    map.set(key, result);
    return result;
}

export function parsePluginSettings(value: unknown): PluginSettings {
    const input = record(value, "Plugin settings");
    const currentDirectory = string(input.currentDirectory, "currentDirectory");
    if (!path.isAbsolute(currentDirectory)) throw new Error("currentDirectory must be absolute");
    const plugins: Record<string, string> = Object.create(null) as Record<string, string>;
    for (const [namespace, specifier] of Object.entries(record(input.plugins, "plugins"))) {
        if (!namespace || namespace === "__proto__") throw new Error("Plugin namespace must be nonempty and must not be __proto__");
        plugins[namespace] = string(specifier, `Plugin "${namespace}" specifier`);
    }
    const pluginResolveFrom: Record<string, string> = Object.create(null) as Record<string, string>;
    if (input.pluginResolveFrom !== undefined) {
        for (const [namespace, origin] of Object.entries(record(input.pluginResolveFrom, "pluginResolveFrom"))) {
            if (!Object.hasOwn(plugins, namespace)) throw new Error(`pluginResolveFrom references unknown plugin "${namespace}"`);
            pluginResolveFrom[namespace] = string(origin, `Resolution origin for plugin "${namespace}"`);
        }
    }
    return { currentDirectory, plugins, pluginResolveFrom };
}

function assertRule(value: unknown, id: string): asserts value is Rule.RuleModule {
    const rule = record(value, `Rule "${id}"`);
    if (typeof rule.create !== "function") throw new Error(`Rule "${id}" must expose create(context); function-style rules are unsupported`);
    if (rule.meta !== undefined) record(rule.meta, `Metadata for rule "${id}"`);
}

function shareValidatedOptions(rule: Rule.RuleModule, key: string): Rule.RuleModule {
    let optionsCache = validatedOptions.get(rule);
    if (!optionsCache) validatedOptions.set(rule, optionsCache = new Map());
    const shared = optionsCache;
    const delegated: Rule.RuleModule = {
        create(context) {
            let options = shared.get(key);
            if (!options || !isDeepStrictEqual(options, context.options)) {
                if (shared.size >= cacheLimit) shared.delete(shared.keys().next().value!);
                options = context.options.slice();
                shared.set(key, options);
            }
            // Match multi-file ESLint configs: fresh option arrays with shared, validated option objects.
            const forwarded = Object.create(context, {
                options: { value: options.slice(), enumerable: true },
            }) as Rule.RuleContext;
            return rule.create(Object.freeze(forwarded));
        },
    };
    if ("meta" in rule) {
        Object.defineProperty(delegated, "meta", {
            configurable: true,
            enumerable: true,
            get: () => rule.meta,
        });
    }
    return delegated;
}

function executionPlugins(plugins: Record<string, ESLint.Plugin>, rules: NormalizedRules): Record<string, ESLint.Plugin> {
    const result: Record<string, ESLint.Plugin> = Object.create(null) as Record<string, ESLint.Plugin>;
    for (const [namespace, plugin] of Object.entries(plugins)) {
        const boundRules: Record<string, Rule.RuleModule> = Object.create(null) as Record<string, Rule.RuleModule>;
        for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
            const id = `${namespace}/${name}`;
            assertRule(rule, id);
            const configured = rules[id];
            boundRules[name] = configured?.[0]
                ? shareValidatedOptions(rule, JSON.stringify(configured.slice(1)))
                : rule;
        }
        result[namespace] = { ...plugin, rules: boundRules };
    }
    return result;
}

async function importPlugins(settings: PluginSettings, key: string): Promise<LoadedPlugins> {
    const plugins: Record<string, ESLint.Plugin> = Object.create(null) as Record<string, ESLint.Plugin>;
    const watchedFiles = new Set<string>();
    await Promise.all(
        Object.entries(settings.plugins).map(async ([namespace, specifier]) => {
            const origin = path.resolve(settings.currentDirectory, settings.pluginResolveFrom?.[namespace] ?? "__tsgo_lint__.cjs");
            const require = createRequire(statSync(origin, { throwIfNoEntry: false })?.isDirectory() ? path.join(origin, "__tsgo_lint__.cjs") : origin);
            const resolved = path.isAbsolute(specifier) ? specifier : require.resolve(specifier);
            const imported: unknown = await import(pathToFileURL(resolved).href);
            watchedFiles.add(resolved);
            for (let directory = path.dirname(resolved);; directory = path.dirname(directory)) {
                const manifest = path.join(directory, "package.json");
                if (existsSync(manifest)) {
                    watchedFiles.add(manifest);
                    break;
                }
                if (path.dirname(directory) === directory) break;
            }
            function watchModule(module: NodeJS.Module): void {
                if (watchedFiles.has(module.filename)) return;
                watchedFiles.add(module.filename);
                for (const child of module.children) watchModule(child);
            }
            for (const child of require.cache[resolved]?.children ?? []) watchModule(child);
            const module = record(imported, `Plugin module "${specifier}"`);
            const plugin = record(module.default ?? module, `Plugin "${namespace}"`);
            const rules: Record<string, Rule.RuleModule> = Object.create(null) as Record<string, Rule.RuleModule>;
            if (plugin.rules !== undefined) {
                for (const [name, rule] of Object.entries(record(plugin.rules, `Rules for plugin "${namespace}"`))) {
                    assertRule(rule, `${namespace}/${name}`);
                    rules[name] = rule;
                }
            }
            plugins[namespace] = { rules };
        }),
    );
    return {
        key,
        plugins,
        ruleNames: Object.entries(plugins).flatMap(([namespace, plugin]) => Object.keys(plugin.rules ?? {}).map(name => `${namespace}/${name}`)).sort(),
        watchedFiles: [...watchedFiles].sort(),
    };
}

export function loadPlugins(input: PluginSettings): Promise<LoadedPlugins> {
    const settings = parsePluginSettings(input);
    const key = JSON.stringify(settings);
    return cache(pluginCache, key, () => importPlugins(settings, key));
}

function compilerOptions(value: unknown): CompilerOptions | undefined {
    if (value === undefined) return undefined;
    const options = record(value, "compilerOptions");
    const jsx = options.jsx;
    const alwaysStrict = options.alwaysStrict;
    const sourceType = options.sourceType;
    if (options.target !== undefined && (typeof options.target !== "number" || !Number.isInteger(options.target) || !(options.target >= 2 && options.target <= 13 || options.target === 99 || options.target === 100))) throw new Error("compilerOptions.target must be a script target enum value");
    if (options.strict !== undefined && typeof options.strict !== "boolean") throw new Error("compilerOptions.strict must be boolean");
    if (options.noLib !== undefined && typeof options.noLib !== "boolean") throw new Error("compilerOptions.noLib must be boolean");
    if (jsx !== undefined && (typeof jsx !== "number" || !Number.isInteger(jsx) || jsx < 0 || jsx > 5)) throw new Error("compilerOptions.jsx must be a JSX enum value");
    if (alwaysStrict !== undefined && typeof alwaysStrict !== "boolean") throw new Error("compilerOptions.alwaysStrict must be boolean");
    if (sourceType !== undefined && sourceType !== "module" && sourceType !== "script") throw new Error("compilerOptions.sourceType must be module or script");
    return {
        target: typeof options.target === "number" ? options.target : undefined,
        strict: typeof options.strict === "boolean" ? options.strict : undefined,
        noLib: typeof options.noLib === "boolean" ? options.noLib : undefined,
        jsx,
        lib: options.lib === undefined ? undefined : strings(options.lib, "compilerOptions.lib"),
        alwaysStrict,
        sourceType,
    };
}

function globals(value: unknown): Linter.Globals {
    const result: Linter.Globals = Object.create(null) as Linter.Globals;
    if (value === undefined) return result;
    for (const [name, setting] of Object.entries(record(value, "globals"))) {
        if (typeof setting !== "boolean" && setting !== "off" && setting !== "readonly" && setting !== "readable" && setting !== "writable" && setting !== "writeable") {
            throw new Error(`Invalid global setting for "${name}"`);
        }
        result[name] = setting;
    }
    return result;
}

export async function loadConfiguration(value: unknown): Promise<LintConfiguration> {
    const input = record(value, "Lint configuration");
    const settings = parsePluginSettings(input);
    const rules = normalizeRules(input.rules);
    const options = compilerOptions(input.compilerOptions);
    const configuredGlobals = globals(input.globals);
    const loaded = await loadPlugins(settings);
    const key = JSON.stringify([loaded.key, rules, options, configuredGlobals]);
    return cache(configurationCache, key, async () => {
        const known = new Set(loaded.ruleNames);
        const enabled: Linter.RulesRecord = Object.create(null) as Linter.RulesRecord;
        for (const [id, entry] of Object.entries(rules)) {
            if (entry[0] === 0) continue;
            if (!known.has(id)) throw new Error(`Unknown enabled JavaScript rule "${id}"`);
            enabled[id] = entry;
        }
        return { currentDirectory: settings.currentDirectory, plugins: executionPlugins(loaded.plugins, rules), rules: enabled, globals: configuredGlobals, compilerOptions: options };
    });
}
