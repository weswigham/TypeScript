//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareFunctionGetTTConstValueGetAsString.ts] ////

//// [input.ts]
declare function get<T>(): T; const value = get() as string;

//// [input.ts]
declare function get<T>(): T; const value = get() as string;
