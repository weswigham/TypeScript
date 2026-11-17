// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"lint":{"rules":{"no-dupe-else-if":"error"}},"files":["input.ts"]}
// @filename: input.ts
if (first) {} else if (second) {} else if (first || second) {}
if (first && second) {} else if (second && first) {}
if (first === 1) {} else if (first === (1)) {}
if (first) {} else if (first || second) {}