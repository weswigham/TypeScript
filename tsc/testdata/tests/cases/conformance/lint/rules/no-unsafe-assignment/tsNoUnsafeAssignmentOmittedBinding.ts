// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unsafe-assignment":"error"}}}
// @filename: input.ts
declare const tuple: [number, any];
const [, value] = tuple;