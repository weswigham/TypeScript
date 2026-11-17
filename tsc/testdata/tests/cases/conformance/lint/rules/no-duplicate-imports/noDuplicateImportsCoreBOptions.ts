// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-duplicate-imports":["error",{"includeExports":true,"allowSeparateTypeImports":true}]}},"files":["input.ts"]}
// @filename: input.ts
import type Item from 'pkg';
import { value } from 'pkg';
export { other } from 'pkg';
export { third } from 'pkg';
import type { Other } from 'pkg';
export * as space from 'pkg';
export * from 'pkg';