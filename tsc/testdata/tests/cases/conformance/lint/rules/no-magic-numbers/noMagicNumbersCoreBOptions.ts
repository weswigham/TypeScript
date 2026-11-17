// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-magic-numbers":["error",{"detectObjects":true,"enforceConst":true,"ignore":[-1,"100n"],"ignoreArrayIndexes":true,"ignoreDefaultValues":true,"ignoreClassFieldInitialValues":true,"ignoreEnums":true,"ignoreNumericLiteralTypes":true,"ignoreReadonlyClassProperties":true,"ignoreTypeIndexes":true}]}},"files":["input.ts"]}
// @filename: input.ts
let declared = 3;
const object = { value: 4 };
array[0];
call(-1, 100n);
function run(value = 5) {}
class Item { readonly value = 6; field = 7; }
enum Choice { First = 8 }
type Value = 9 | -10;
type Index = Other[11 | 12];