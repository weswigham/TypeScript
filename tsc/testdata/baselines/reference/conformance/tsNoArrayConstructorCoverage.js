//// [tests/cases/conformance/lint/rules/no-array-constructor/tsNoArrayConstructorCoverage.ts] ////

//// [input.ts]
const emptyViolation = Array();
const newViolation = new Array(1, 2);
const callViolation = Array("first", "second");
const commentViolation = Array(/* retained element comment */ 1, 2);
const validLength = Array(3);
const validNewLength = new Array(3);
const validTyped = Array<number>();
const validNewTyped = new Array<number>(1, 2);
const validLiteral = [1, 2];
function validFactory(factory: () => number[]): number[] { return factory(); }
export {};

//// [input.ts]
const emptyViolation = [];
const newViolation = [1, 2];
const callViolation = ["first", "second"];
const commentViolation = [/* retained element comment */ 1, 2];
const validLength = Array(3);
const validNewLength = new Array(3);
const validTyped = Array<number>();
const validNewTyped = new Array<number>(1, 2);
const validLiteral = [1, 2];
function validFactory(factory: () => number[]): number[] { return factory(); }
export {};
