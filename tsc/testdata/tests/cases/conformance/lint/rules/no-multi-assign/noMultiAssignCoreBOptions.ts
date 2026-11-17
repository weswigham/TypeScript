// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-multi-assign":["error",{"ignoreNonDeclaration":true}]}},"files":["input.ts"]}
// @filename: input.ts
first = second = 1;
let declaration = first = 1;
class Item { field = first = 1; }