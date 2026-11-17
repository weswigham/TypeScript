//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionConstValueNumber1ConstOtherValueAsUnknownAsNumber.ts] ////

//// [input.ts]
const value: number = 1; const other = value as unknown as number;

//// [input.ts]
const value: number = 1; const other = value;
