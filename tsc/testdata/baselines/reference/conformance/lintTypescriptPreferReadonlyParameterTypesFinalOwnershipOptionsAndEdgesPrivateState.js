//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipOptionsAndEdgesPrivateState.ts] ////

//// [input.ts]
class C { #value = 1; #method() {} } function f(value: C) {}

//// [input.ts]
class C { #value = 1; #method() {} } function f(value: C) {}
