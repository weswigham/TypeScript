// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"id-match":["error","^(?!forbidden$)[a-zA-Z]+$",{"properties":true,"classFields":true,"ignoreDestructuring":true}]}},"files":["input.ts"]}
// @filename: input.ts
let forbidden;
let bad_name;
bad_name();
object.bad_name = 1;
const { original_name, key: alias_name, ...rest_name } = source;
class Example { #bad_name; bad_method() {} }
Object.keys(source);