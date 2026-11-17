//// [tests/cases/conformance/lint/rules/no-unnecessary-condition/lintTypescriptNoUnnecessaryConditionFinalBooleanConditionDeclareConstValueBooleanIfValueTrue.ts] ////

//// [input.ts]
declare const value: boolean; if (value && true) {}

//// [input.ts]
declare const value: boolean; if (value && true) {}
