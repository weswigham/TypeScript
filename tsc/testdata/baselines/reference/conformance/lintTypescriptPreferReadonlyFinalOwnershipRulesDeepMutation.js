//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesDeepMutation.ts] ////

//// [input.ts]
class C { private value = { count: 1 }; method() { this.value.count++; } }

//// [input.ts]
class C { private readonly value = { count: 1 }; method() { this.value.count++; } }
