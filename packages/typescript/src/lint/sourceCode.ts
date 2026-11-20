import type { TSESTree } from "@typescript-eslint/types";
import { SourceCode } from "eslint";

type TraversalStep = ReturnType<SourceCode["traverse"]> extends Iterable<infer Step> ? Step : never;

function isNode(value: unknown): value is TSESTree.Node {
    return value !== null && typeof value === "object" && "type" in value && typeof value.type === "string";
}

export class NativeSourceCode extends SourceCode {
    readonly #root: TSESTree.Program;
    readonly #needsCodePaths: () => boolean;

    constructor(config: SourceCode.Config, root: TSESTree.Program, needsCodePaths: () => boolean) {
        Reflect.set(root, "parent", null);
        super(config);
        this.#root = root;
        this.#needsCodePaths = needsCodePaths;
    }

    override *traverse(): Iterable<TraversalStep> {
        // ESLint asks for the iterable before creating rules, but iterates afterwards.
        if (this.#needsCodePaths()) {
            yield* super.traverse();
            return;
        }
        const nodes: TSESTree.Node[] = [this.#root];
        const exits: boolean[] = [false];
        while (nodes.length) {
            const node = nodes.pop()!;
            const exit = exits.pop()!;
            if (!exit) {
                nodes.push(node);
                exits.push(true);
                const keys = this.visitorKeys[node.type];
                if (!keys) throw new Error(`Missing native lint visitor keys for "${node.type}"`);
                for (let keyIndex = keys.length - 1; keyIndex >= 0; keyIndex--) {
                    const value: unknown = Reflect.get(node, keys[keyIndex]);
                    if (Array.isArray(value)) {
                        for (let index = value.length - 1; index >= 0; index--) {
                            if (isNode(value[index])) {
                                Reflect.set(value[index], "parent", node);
                                nodes.push(value[index]);
                                exits.push(false);
                            }
                        }
                    }
                    else if (isNode(value)) {
                        Reflect.set(value, "parent", node);
                        nodes.push(value);
                        exits.push(false);
                    }
                }
            }
            yield { kind: 1, target: node, phase: exit ? 2 : 1, args: [node] };
        }
    }
}
