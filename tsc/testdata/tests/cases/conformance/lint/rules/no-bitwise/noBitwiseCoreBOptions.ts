// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-bitwise":["error",{"allow":["~"],"int32Hint":true}]}},"files":["input.ts"]}
// @filename: input.ts
value | 0;
~value;
value | 1;
value &= 1;