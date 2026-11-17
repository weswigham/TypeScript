//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipOptionsAndEdgesConditional.ts] ////

//// [input.ts]
function f<T>(value: T extends string ? string[] : readonly string[]) {}

//// [input.ts]
function f<T>(value: T extends string ? string[] : readonly string[]) {}
