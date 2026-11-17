// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-redundant-type-constituents":"error"}},"files":["input.ts"]}
// @filename: input.ts
export {};
type RedundantLiteral = string | "x";
type AnyOverrides = string | any;
type UnknownOverrides = number | unknown;
type RedundantPrimitive = string & "x";
type RedundantNever = string | never;
type DistinctPrimitives = string | number;
type DistinctLiterals = "x" | "y";
function neverReturn(): string | never { return ""; }