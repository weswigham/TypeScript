//// [tests/cases/conformance/lint/rules/array-type/tsArrayTypeCoverage.ts] ////

//// [input.ts]
type MutableViolation = Array<string>;
type ReadonlyViolation = ReadonlyArray<number>;
type UnionViolation = Array<string | number>;
type MutableValid = string[];
type ReadonlyValid = readonly number[];
type Shadowed<Array> = Array;
export {};

//// [input.ts]
type MutableViolation = string[];
type ReadonlyViolation = readonly number[];
type UnionViolation = (string | number)[];
type MutableValid = string[];
type ReadonlyValid = readonly number[];
type Shadowed<Array> = Array;
export {};
