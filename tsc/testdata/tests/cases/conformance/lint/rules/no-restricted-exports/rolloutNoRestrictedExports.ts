// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-restricted-exports":["error",{"restrictedNamedExports":["denied"],"restrictedNamedExportsPattern":"^private","restrictDefaultExports":{"direct":true,"named":true,"defaultFrom":true,"namedFrom":true,"namespaceFrom":true}}]}},"files":["input.ts"]}
// @filename: input.ts
export const { key: denied, ...allowed } = source;
export function privateFunction() {}
export default class Example {}
export { allowed as denied, allowed as default };
export { default } from "module";
export { value as default } from "other";
export * as default from "namespace";