//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipOptionsAndEdgesSetter.ts] ////

//// [input.ts]
class C { get value() { return 1; } set value(value: number) {} } function f(value: C) {}

//// [input.ts]
class C { get value() { return 1; } set value(value: number) {} } function f(value: C) {}
