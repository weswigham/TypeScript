// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-inner-declarations":["error","both",{"blockScopedFunctions":"disallow"}]}},"files":["input.ts"]}
// @filename: input.ts
export {};
if (ready) { function nested() {} var hoisted; let allowed; }
class Item {
    static { if (ready) { var nested; } }
    method() { for (var index = 0; index < 3; index++) {} }
}