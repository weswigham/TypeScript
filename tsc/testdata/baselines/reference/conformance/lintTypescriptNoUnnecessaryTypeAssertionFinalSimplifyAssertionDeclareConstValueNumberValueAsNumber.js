//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareConstValueNumberValueAsNumber.ts] ////

//// [input.ts]
declare const value: number; value as number;

//// [input.ts]
declare const value: number; value;
