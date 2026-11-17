//// [tests/cases/conformance/lint/rules/no-redundant-type-constituents/tsNoRedundantTypeConstituentsCoverage.ts] ////

//// [input.ts]
export {};
type RedundantLiteral = string | "x";
type AnyOverrides = string | any;
type UnknownOverrides = number | unknown;
type RedundantPrimitive = string & "x";
type RedundantNever = string | never;
type DistinctPrimitives = string | number;
type DistinctLiterals = "x" | "y";
function neverReturn(): string | never { return ""; }

//// [input.ts]
export {};
type RedundantLiteral = string | "x";
type AnyOverrides = string | any;
type UnknownOverrides = number | unknown;
type RedundantPrimitive = string & "x";
type RedundantNever = string | never;
type DistinctPrimitives = string | number;
type DistinctLiterals = "x" | "y";
function neverReturn(): string | never { return ""; }
