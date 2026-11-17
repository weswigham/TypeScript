//// [tests/cases/conformance/lint/rules/no-invalid-void-type/tsNoInvalidVoidTypeCoverage.ts] ////

//// [input.ts]
function invalidParameter(value: void): void {}
type InvalidUnion = void | number;

let pending: Promise<void>;
type MaybePending = void | Promise<void>;
function validReturn(): void {}
function validThis(this: void) {}

//// [input.ts]
function invalidParameter(value: void): void {}
type InvalidUnion = void | number;

let pending: Promise<void>;
type MaybePending = void | Promise<void>;
function validReturn(): void {}
function validThis(this: void) {}
