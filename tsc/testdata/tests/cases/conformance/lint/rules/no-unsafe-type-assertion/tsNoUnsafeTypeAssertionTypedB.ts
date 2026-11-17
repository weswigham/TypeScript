// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @noEmit: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unsafe-type-assertion":"error"}}}
// @filename: input.ts
declare const value: string | number;
declare const unsafe: Set<any>;
value as string;
unsafe as Set<string>;
value as string | number | boolean;
function generic<T extends string>(text: string) { return text as T; }