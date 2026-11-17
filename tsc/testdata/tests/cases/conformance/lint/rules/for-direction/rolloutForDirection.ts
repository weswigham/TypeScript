// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"for-direction":"error"}},"files":["input.ts"]}
// @filename: input.ts
for (let index = 0; index < 10; index--) { use(index); }
for (let index = 0; 10 > index; index -= 2) {}
var step = -2;
for (let index = 0; index <= 10; index += step) {}
for (let index = 0; index < 10; other++, index--) {}
for (let index = 0; index < 10; index++, index--) {}
for (let index = 0; index < 10; index++) {}