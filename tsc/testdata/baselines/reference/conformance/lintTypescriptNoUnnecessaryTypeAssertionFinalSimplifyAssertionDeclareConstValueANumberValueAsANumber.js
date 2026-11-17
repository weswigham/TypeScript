//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareConstValueANumberValueAsANumber.ts] ////

//// [input.ts]
declare const value: { a: number }; value as { a: number };

//// [input.ts]
declare const value: { a: number }; value;
