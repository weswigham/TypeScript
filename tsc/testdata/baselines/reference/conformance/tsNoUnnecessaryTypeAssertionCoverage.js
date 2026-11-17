//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/tsNoUnnecessaryTypeAssertionCoverage.ts] ////

//// [input.ts]
export {};
declare const value: number;
value as number;
value!;
const redundantLiteral = 3 as 3;
declare const shape: { field: number };
shape as { field: number };
let narrowLiteral = 3 as 3;
const constant = 3 as const;
declare const nullable: number | null;
const required: number = nullable!;
declare const readonlyShape: { readonly field: number };
readonlyShape as { field: number };

//// [input.ts]
export {};
declare const value: number;
value;
value;
const redundantLiteral = 3;
declare const shape: { field: number };
shape;
let narrowLiteral = 3 as 3;
const constant = 3 as const;
declare const nullable: number | null;
const required: number = nullable!;
declare const readonlyShape: { readonly field: number };
readonlyShape as { field: number };
