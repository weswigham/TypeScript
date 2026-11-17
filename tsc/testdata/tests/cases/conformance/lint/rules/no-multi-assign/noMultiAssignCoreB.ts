// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-multi-assign":"error"}},"files":["input.ts"]}
// @filename: input.ts
let first = second = third = 1;
first = second = 1;
class Item { field = second = 1; }
let separate = 1, other = 2;
first = second;