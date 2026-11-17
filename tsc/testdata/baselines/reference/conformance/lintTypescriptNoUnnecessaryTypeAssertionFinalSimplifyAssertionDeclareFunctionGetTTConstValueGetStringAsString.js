//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareFunctionGetTTConstValueGetStringAsString.ts] ////

//// [input.ts]
declare function get<T>(): T; const value = get<string>() as string;

//// [input.ts]
declare function get<T>(): T; const value = get<string>();
