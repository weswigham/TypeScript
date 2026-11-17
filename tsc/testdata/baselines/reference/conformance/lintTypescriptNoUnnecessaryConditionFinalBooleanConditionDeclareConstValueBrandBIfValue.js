//// [tests/cases/conformance/lint/rules/no-unnecessary-condition/lintTypescriptNoUnnecessaryConditionFinalBooleanConditionDeclareConstValueBrandBIfValue.ts] ////

//// [input.ts]
declare const value: '' & { brand: 'b' }; if (value) {}

//// [input.ts]
declare const value: '' & { brand: 'b' }; if (value) {}
