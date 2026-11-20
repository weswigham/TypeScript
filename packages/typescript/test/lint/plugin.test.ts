import assert from "node:assert/strict";
import { test } from "node:test";
import type {
    Context,
    CreateRule,
    ESTree,
    Fixer,
    Plugin,
    RuleMeta,
    SourceCode,
    Visitor,
} from "../../src/lint/plugin.ts";

class Rule {
    readonly meta: RuleMeta = { schema: [], messages: { rename: "Rename {{name}}" }, fixable: "code" };
    readonly create: CreateRule = (context: Context): Visitor => {
        const source: SourceCode = context.sourceCode;
        return {
            Identifier(node: ESTree.Identifier): void {
                const token = source.getFirstToken(node);
                assert.equal(source.getText(token ?? node), node.name);
                context.report({
                    node,
                    messageId: "rename",
                    data: { name: node.name },
                    fix: (fixer: Fixer) => fixer.replaceText(node, "renamed"),
                });
            },
        };
    };
}

test("plugin authoring types accept typed class-instance visitors and fixers", () => {
    const plugin: Plugin = { rules: { example: new Rule() } };
    assert.equal(typeof plugin.rules?.example.create, "function");
});
