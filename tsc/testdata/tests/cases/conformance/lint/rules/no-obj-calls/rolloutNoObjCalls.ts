// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-obj-calls":"error"}},"files":["input.ts"]}
// @filename: input.ts
Math();
new JSON();
Intl?.();
globalThis.Math();
const alias = condition ? other : Reflect;
alias();
const { JSON: json } = globalThis;
new json();
Math.random();
function shadow(Math) { Math(); }