//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipOptionsAndEdgesDelete.ts] ////

//// [input.ts]
class C { private value = 1; method() { delete this.value; } }

//// [input.ts]
class C { private value = 1; method() { delete this.value; } }
