import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import getExePath from "../../lib/getExePath.js";
import { getAPIProcessEnv } from "../../src/api/options.ts";

test("native-owned workers reuse the API for typed plugins, authorization and combined fixes", () => {
    const directory = fileURLToPath(new URL(`../../../../.lint-integration-${randomUUID()}/`, import.meta.url));
    mkdirSync(directory);
    try {
        const marker = join(directory, "imported");
        writeFileSync(
            join(directory, "plugin.mjs"),
            `
import {writeFileSync} from "node:fs";
import {threadId} from "node:worker_threads";
writeFileSync(${JSON.stringify(marker)}, "loaded");
export default {rules:{typed:{meta:{schema:[],fixable:"code"},create(context){
return {VariableDeclarator(node){
if(node.id.type!=="Identifier"||node.id.name!=="value")return;
const services=context.sourceCode.parserServices;
const type=services.getTypeAtLocation(node.id);
context.report({node:node.id,message:"native "+services.program.getTypeChecker().typeToString(type)+" pid="+process.pid+" thread="+threadId,
fix:fixer=>fixer.replaceTextRange([node.id.range[0],node.id.range[0]+node.id.name.length],"renamed")});
}};}}}};
`,
        );
        writeFileSync(join(directory, "first.ts"), "const value: number = 1;\ndebugger;\n");
        writeFileSync(join(directory, "second.ts"), 'export const value: string = "native";\n');
        writeFileSync(
            join(directory, "tsconfig.json"),
            JSON.stringify({
                compilerOptions: { target: "esnext" },
                files: ["first.ts", "second.ts"],
                lint: { plugins: { local: "./plugin.mjs" }, rules: { "local/typed": "error", "no-debugger": "warn" } },
            }),
        );
        const run = (...args: string[]) => {
            const result = spawnSync(getExePath(), [
                "--internal-lint-host",
                process.execPath,
                fileURLToPath(new URL("../../dist/lint/shim.js", import.meta.url)),
                "--lintOnly",
                "--pretty",
                "false",
                "--project",
                join(directory, "tsconfig.json"),
                ...args,
            ], {
                encoding: "utf8",
                env: { ...getAPIProcessEnv(), GOMAXPROCS: "2" },
            });
            if (result.error) throw result.error;
            assert.equal(result.signal, null, result.stderr);
            return result;
        };
        const denied = run();
        assert.equal(denied.status, 1, denied.stdout + denied.stderr);
        assert.match(denied.stdout, /--runExternalCode/);
        assert.equal(existsSync(marker), false);
        const reported = run("--runExternalCode");
        assert.equal(reported.status, 1, reported.stdout + reported.stderr);
        assert.match(reported.stdout, /local\/typed: native number/);
        assert.match(reported.stdout, /local\/typed: native string/);
        assert.match(reported.stdout, /Unexpected 'debugger'/);
        const workers = [...reported.stdout.matchAll(/pid=(\d+) thread=(\d+)/g)];
        assert.equal(workers.length, 2, reported.stdout + reported.stderr);
        assert.equal(new Set(workers.map(match => match[1])).size, 1);
        assert.equal(new Set(workers.map(match => match[2])).size, 2);
        const fixed = run("--runExternalCode", "--fix");
        assert.equal(fixed.status, 0, fixed.stdout + fixed.stderr);
        assert.match(readFileSync(join(directory, "first.ts"), "utf8"), /const renamed: number/);
        assert.doesNotMatch(readFileSync(join(directory, "first.ts"), "utf8"), /debugger/);
        assert.match(readFileSync(join(directory, "second.ts"), "utf8"), /const renamed: string/);
    }
    finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
