// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-unsafe-declaration-merging":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
class Unsafe {}
interface Unsafe { field: string; }
interface Reverse { value: number; }
class Reverse {}
interface Safe { first: string; }
interface Safe { second: number; }
class Namespaced {}
namespace Namespaced { export const value = 1; }
class Separate {}
namespace Nested { export interface Separate { value: string; } }