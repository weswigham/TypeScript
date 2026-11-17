//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesExportValueFromOtherConstValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
export { value } from './other'; const value = 1;

//// [input.ts]
export { value } from './other'; const value = 1;
