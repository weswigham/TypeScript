// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-redeclare":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
var repeated: number;
var repeated: number;
interface Merged { first: string; }
interface Merged { second: number; }
class Augmented {}
interface Augmented { field: string; }
function overload(value: string): string;
function overload(value: number): number;
function overload(value: string | number) { return value; }
function separate() { var repeated: number; }