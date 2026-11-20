import type {
    ESLint,
    Rule,
} from "eslint";

export interface FileRuleState {
    failures: Map<string, string>;
    needsCodePaths: boolean;
}

/** Plugin wrappers are batch-local; contexts and failure state are file-local. */
export function isolateRules(plugins: Record<string, ESLint.Plugin>, currentFile: () => FileRuleState): Record<string, ESLint.Plugin> {
    const isolated: Record<string, ESLint.Plugin> = {};
    for (const [namespace, plugin] of Object.entries(plugins)) {
        const rules: Record<string, Rule.RuleModule> = {};
        for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
            if (typeof rule === "function") continue;
            const id = `${namespace}/${name}`;
            rules[name] = {
                ...rule,
                create(context) {
                    const file = currentFile();
                    const failures = file.failures;
                    let failed = false;
                    function fail(error: unknown): void {
                        if (failed) return;
                        failed = true;
                        failures.set(id, `Rule "${id}" failed: ${error instanceof Error ? error.message : String(error)}`);
                    }
                    let listeners: Rule.RuleListener;
                    try {
                        listeners = rule.create(context);
                        if (!listeners || typeof listeners !== "object" || Array.isArray(listeners)) throw new Error("create(context) must return a listener object");
                    }
                    catch (error) {
                        fail(error);
                        return {};
                    }
                    const wrapped: Rule.RuleListener = {};
                    for (const [selector, listener] of Object.entries(listeners)) {
                        if (typeof listener !== "function") {
                            fail(new Error(`Non-function listener for "${selector}"`));
                            continue;
                        }
                        if (selector.startsWith("onCodePath") || selector.startsWith("onUnreachableCodePath")) file.needsCodePaths = true;
                        wrapped[selector] = function (this: unknown, ...args: Parameters<typeof listener>) {
                            if (failed) return;
                            try {
                                Reflect.apply(listener, this, args);
                            }
                            catch (error) {
                                fail(error);
                            }
                        };
                    }
                    return wrapped;
                },
            };
        }
        isolated[namespace] = { ...plugin, rules };
    }
    return isolated;
}
