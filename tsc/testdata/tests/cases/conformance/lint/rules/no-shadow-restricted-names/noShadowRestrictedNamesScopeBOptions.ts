// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-shadow-restricted-names":["error",{"reportGlobalThis":false}]}},"files":["input.ts"]}
// @filename: input.ts
function allowed(globalThis) {}
function disallowed(Infinity) {}