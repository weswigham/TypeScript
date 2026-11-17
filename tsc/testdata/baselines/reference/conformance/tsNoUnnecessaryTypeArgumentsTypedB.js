//// [tests/cases/conformance/lint/rules/no-unnecessary-type-arguments/tsNoUnnecessaryTypeArgumentsTypedB.ts] ////

//// [input.ts]
function invoke<T = number, U = string>() {}
invoke<boolean, string>();
invoke<number, boolean>();
type Box<T = string> = T[];
let box: Box<string>;
const instantiated = invoke<number, string>;

//// [input.ts]
function invoke<T = number, U = string>() {}
invoke<boolean>();
invoke<number, boolean>();
type Box<T = string> = T[];
let box: Box;
const instantiated = invoke<number, string>;
