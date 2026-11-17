//// [tests/cases/conformance/lint/rules/no-unnecessary-type-arguments/lintTypescriptNoUnnecessaryTypeArgumentsTypedBRedundantTypeBoxTStringTLetValueBoxString.ts] ////

//// [input.ts]
type Box<T = string> = T[]; let value: Box<string>;

//// [input.ts]
type Box<T = string> = T[]; let value: Box;
