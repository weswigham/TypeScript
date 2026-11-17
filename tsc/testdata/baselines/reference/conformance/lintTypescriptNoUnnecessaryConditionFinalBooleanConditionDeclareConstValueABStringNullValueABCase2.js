//// [tests/cases/conformance/lint/rules/no-unnecessary-condition/lintTypescriptNoUnnecessaryConditionFinalBooleanConditionDeclareConstValueABStringNullValueABCase2.ts] ////

//// [input.ts]
declare const value: { a?: { b: string } } | null; value?.a?.b

//// [input.ts]
declare const value: { a?: { b: string } } | null; value?.a?.b
