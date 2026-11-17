// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-label-var":"error"}},"files":["input.ts"]}
// @filename: input.ts
let outer;
function run(parameter) {
    outer: while (ready) { break outer; }
    parameter: {}
    fresh: {}
}
function separate() { let fresh; }