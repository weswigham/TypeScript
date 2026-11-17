//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipRulesRecursiveShallow.ts] ////

//// [input.ts]
interface R { next: R } function f(value: Readonly<R>) {}

//// [input.ts]
interface R { next: R } function f(value: Readonly<R>) {}
