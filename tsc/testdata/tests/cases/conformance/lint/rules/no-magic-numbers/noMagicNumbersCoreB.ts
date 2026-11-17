// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-magic-numbers":"error"}},"files":["input.ts"]}
// @filename: input.ts
let declared = 3;
const object = { value: 4 };
object.value = 5;
declared = 6;
call(7, -8, 100n);
parseInt(text, 10);
Number.parseInt(text, 16);
const array = [1, 2];
array[0];