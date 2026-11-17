import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(path.resolve(process.argv[2] ?? process.cwd(), "package.json"));
const eslint = require("eslint/package.json");
const typescriptESLint = require("@typescript-eslint/eslint-plugin/package.json");
const { builtinRules } = require("eslint/use-at-your-own-risk");
const plugin = require("@typescript-eslint/eslint-plugin");
const rules = {};
for (
    const [prefix, entries] of [
        ["", builtinRules],
        ["@typescript-eslint/", Object.entries(plugin.rules)],
    ]
) {
    for (const [name, rule] of entries) {
        if (rule.meta.deprecated) continue;
        const schema = rule.meta.schema ?? [];
        rules[prefix + name] = Array.isArray(schema)
            ? { type: "array", items: schema, maxItems: schema.length }
            : schema;
    }
}
assert.equal(eslint.version, "10.14.0");
assert.equal(typescriptESLint.version, "8.72.1");
assert.equal(Object.keys(rules).length, 326);
const license = name => fs.readFileSync(path.join(path.dirname(require.resolve(`${name}/package.json`)), "LICENSE"), "utf8");
const output = {
    sources: {
        eslint: { version: eslint.version, license: license("eslint") },
        typescriptESLint: { version: typescriptESLint.version, license: license("@typescript-eslint/eslint-plugin") },
    },
    rules: Object.fromEntries(Object.entries(rules).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)),
};
const filename = fileURLToPath(new URL("../../../tsc/internal/lint/config/rule-options.generated.json", import.meta.url));
fs.mkdirSync(path.dirname(filename), { recursive: true });
fs.writeFileSync(filename, JSON.stringify(output, null, 4) + "\n");
console.log(`Generated ${Object.keys(rules).length} rule option schemas.`);
