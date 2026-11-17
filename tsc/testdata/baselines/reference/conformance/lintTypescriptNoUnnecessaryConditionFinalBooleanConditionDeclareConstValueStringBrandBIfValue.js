//// [tests/cases/conformance/lint/rules/no-unnecessary-condition/lintTypescriptNoUnnecessaryConditionFinalBooleanConditionDeclareConstValueStringBrandBIfValue.ts] ////

//// [input.ts]
declare const value: string & { brand: 'b' }; if (value) {}

//// [input.ts]
declare const value: string & { brand: 'b' }; if (value) {}
