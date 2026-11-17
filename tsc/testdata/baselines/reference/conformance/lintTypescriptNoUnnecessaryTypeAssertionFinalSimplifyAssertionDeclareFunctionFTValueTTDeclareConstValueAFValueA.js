//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareFunctionFTValueTTDeclareConstValueAFValueA.ts] ////

//// [input.ts]
declare function f<T>(value: T): T; declare const value: 'a'; f(value as string);

//// [input.ts]
declare function f<T>(value: T): T; declare const value: 'a'; f(value as string);
