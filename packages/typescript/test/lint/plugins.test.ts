import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
    mkdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";
import {
    describe,
    test,
} from "node:test";
import { fileURLToPath } from "node:url";
import {
    loadPlugins,
    normalizeRules,
} from "../../src/lint/config.ts";

const directory = fileURLToPath(new URL("./fixtures/", import.meta.url));

describe("standalone plugin jobs", () => {
    test("resolves inherited package plugin names from the supplied origin rather than the shim", async () => {
        const plugins = await loadPlugins({
            currentDirectory: path.parse(directory).root,
            plugins: { json: "eslint" },
            pluginResolveFrom: { json: path.join(directory, "tsconfig.base.json") },
        });
        assert.deepEqual(plugins.ruleNames, []);
        const fixture = await loadPlugins({
            currentDirectory: directory,
            plugins: { fixture: fileURLToPath(new URL("./fixtures/plugin.mjs", import.meta.url)) },
        });
        assert.ok(fixture.ruleNames.includes("fixture/prototype"));
        assert.ok(fixture.watchedFiles.includes(fileURLToPath(new URL("./fixtures/plugin.mjs", import.meta.url))));
        assert.ok(fixture.watchedFiles.includes(fileURLToPath(new URL("../../package.json", import.meta.url))));
        const fromDirectory = await loadPlugins({
            currentDirectory: path.parse(directory).root,
            plugins: { json: "eslint" },
            pluginResolveFrom: { json: directory },
        });
        assert.deepEqual(fromDirectory.ruleNames, []);
    });

    test("rejects invalid rule severities and non-JSON options", () => {
        assert.throws(() => normalizeRules({ "rule/name": "fatal" }), /severity/i);
        assert.throws(() => normalizeRules({ "rule/name": ["error", undefined] }), /JSON|undefined/i);
    });

    test("resolves package specifiers inside a supplied configuration directory", async () => {
        const origin = path.join(directory, `.resolution-${randomUUID()}`);
        const module = path.join(origin, "node_modules", "local-lint-plugin");
        mkdirSync(module, { recursive: true });
        try {
            writeFileSync(path.join(module, "package.json"), JSON.stringify({ type: "module", main: "./index.mjs" }));
            writeFileSync(path.join(module, "index.mjs"), "export default { rules: { local: { create() { return {}; } } } };");
            const plugins = await loadPlugins({
                currentDirectory: path.parse(directory).root,
                plugins: { fixture: "local-lint-plugin" },
                pluginResolveFrom: { fixture: origin },
            });
            assert.deepEqual(plugins.ruleNames, ["fixture/local"]);
        }
        finally {
            rmSync(origin, { recursive: true, force: true });
        }
    });
});
