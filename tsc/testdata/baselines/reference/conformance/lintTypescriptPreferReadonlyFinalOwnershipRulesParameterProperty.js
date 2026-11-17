//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesParameterProperty.ts] ////

//// [input.ts]
class C { constructor(private value = 1) {} }

//// [input.ts]
class C { constructor(private readonly value = 1) {} }
