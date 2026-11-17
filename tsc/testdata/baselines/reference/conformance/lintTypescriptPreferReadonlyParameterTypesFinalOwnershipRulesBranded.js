//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipRulesBranded.ts] ////

//// [input.ts]
type ID = string & { tag: unique symbol }; function f(value: ID) {}

//// [input.ts]
type ID = string & { tag: unique symbol }; function f(value: ID) {}
