// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @noEmit: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unsafe-unary-minus":"error"}}}
// @filename: input.ts
declare const numeric: number | bigint;
declare const mixed: number | string;
-numeric;
-mixed;
-"123";
function constrained<T extends number>(value: T) { return -value; }
function unconstrained<T>(value: T) { return -value; }