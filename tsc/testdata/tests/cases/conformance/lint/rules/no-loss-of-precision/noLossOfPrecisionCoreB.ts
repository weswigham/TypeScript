// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-loss-of-precision":"error"}},"files":["input.ts"]}
// @filename: input.ts
const values = [9007199254740993, 9007199254740991, 0x20000000000001,
    0b100000000000000000000000000000000000000000000000000001,
    1e999, 1e-999, 0e999, 5e-324, 9.00e2,
    1230000000000000000000000, 1230000000000000000000000.0,
    1.0000000000000000000000123, 9007199254740993n];