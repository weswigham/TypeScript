// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-unnecessary-type-constraint":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
function unnecessary<T extends any>() {}
class Unnecessary<T extends unknown> {}
const unnecessaryArrow = <T extends unknown>() => {};
function unconstrained<T>() {}
function numberConstraint<T extends number>() {}
function unionConstraint<T extends any | number>() {}
type Alias = any;
function aliasConstraint<T extends Alias>() {}