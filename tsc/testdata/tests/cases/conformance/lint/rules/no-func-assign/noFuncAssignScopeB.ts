// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-func-assign":"error"}},"files":["input.ts"]}
// @filename: input.ts
function task() {}
task = replacement;
[task] = tasks;
({ task } = source);
const callback = function named() { named++; };
function shadow(task) { task = replacement; }
function local() { var local; local = replacement; }
let expression = function() {};
expression = replacement;