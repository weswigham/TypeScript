// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-bitwise":"error"}},"files":["input.ts"]}
// @filename: input.ts
let value = 1;
value |= 2;
~value;
value << 1;
value >>>= 1;
value ||= 1;
value && 2;