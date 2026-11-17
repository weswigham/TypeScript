//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesUnrelated.ts] ////

//// [input.ts]
class C { private value = 1; method(other: { value: number }) { other.value++; } }

//// [input.ts]
class C { private readonly value = 1; method(other: { value: number }) { other.value++; } }
