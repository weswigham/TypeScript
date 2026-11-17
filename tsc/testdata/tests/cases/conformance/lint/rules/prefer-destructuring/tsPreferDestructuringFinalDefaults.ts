// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/prefer-destructuring":"error"}}}
// @filename: input.ts
declare const source: { value: number; other: number };
declare const values: number[];
declare const indexed: { 0: number };
const value = source.value;
const renamed = source.other;
const annotated: number = source.value;
const first = values[0];
const indexedFirst = indexed[0];
const other /* preserved */ = source.other;