// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-multi-str":"error"}},"files":["input.ts"]}
// @filename: input.ts
const multiline = 'first\
second';
const escaped = 'first\nsecond';
const template = `first
second`;