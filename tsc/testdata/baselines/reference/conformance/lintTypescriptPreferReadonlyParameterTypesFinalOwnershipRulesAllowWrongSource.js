//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipRulesAllowWrongSource.ts] ////

//// [input.ts]
interface RegExp { value: number } function f(value: RegExp) {}

//// [input.ts]
interface RegExp { value: number } function f(value: RegExp) {}
