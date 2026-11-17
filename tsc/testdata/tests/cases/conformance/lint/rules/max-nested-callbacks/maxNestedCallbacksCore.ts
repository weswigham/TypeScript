// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "compilerOptions": { "target": "esnext" },
    "lint": { "rules": { "max-nested-callbacks": ["error", { "max": 1, "checkConstructorCallCallbacks": true }] } },
    "files": ["input.ts"]
}
// @filename: input.ts
call(() => { call(() => 1); });
new Example(() => { new Example(() => 1); });
call(function first() { function ordinary() {} });
(() => { (() => 1)(); })();