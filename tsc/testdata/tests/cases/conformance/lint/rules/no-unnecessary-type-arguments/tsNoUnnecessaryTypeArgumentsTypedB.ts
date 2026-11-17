// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true},"lint":{"rules":{"@typescript-eslint/no-unnecessary-type-arguments":"error"}}}
// @filename: input.ts
function invoke<T = number, U = string>() {}
invoke<boolean, string>();
invoke<number, boolean>();
type Box<T = string> = T[];
let box: Box<string>;
const instantiated = invoke<number, string>;