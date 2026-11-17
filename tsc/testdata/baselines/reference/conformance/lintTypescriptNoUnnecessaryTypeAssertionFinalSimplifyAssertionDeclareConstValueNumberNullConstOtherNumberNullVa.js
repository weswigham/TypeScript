//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareConstValueNumberNullConstOtherNumberNullVa.ts] ////

//// [input.ts]
declare const value: number | null; const other: number | null = value!;

//// [input.ts]
declare const value: number | null; const other: number | null = value;
