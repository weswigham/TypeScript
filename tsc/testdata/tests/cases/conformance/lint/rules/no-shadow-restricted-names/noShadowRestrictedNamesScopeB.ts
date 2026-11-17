// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-shadow-restricted-names":"error"}},"files":["input.ts"]}
// @filename: input.ts
function run(undefined, NaN, { eval: arguments }) {}
function safe() { var undefined; use(undefined); }
function assigned() { var undefined; undefined = 1; }
try { work(); } catch (undefined) {}
function shadow(globalThis) {}