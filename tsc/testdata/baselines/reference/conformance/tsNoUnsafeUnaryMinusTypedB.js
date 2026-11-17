//// [tests/cases/conformance/lint/rules/no-unsafe-unary-minus/tsNoUnsafeUnaryMinusTypedB.ts] ////

//// [input.ts]
declare const numeric: number | bigint;
declare const mixed: number | string;
-numeric;
-mixed;
-"123";
function constrained<T extends number>(value: T) { return -value; }
function unconstrained<T>(value: T) { return -value; }

//// [input.ts]
declare const numeric: number | bigint;
declare const mixed: number | string;
-numeric;
-mixed;
-"123";
function constrained<T extends number>(value: T) { return -value; }
function unconstrained<T>(value: T) { return -value; }
