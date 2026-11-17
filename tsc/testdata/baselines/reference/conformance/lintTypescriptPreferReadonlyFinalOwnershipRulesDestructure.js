//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesDestructure.ts] ////

//// [input.ts]
class C { #value = 1; method() { [this.#value] = [2]; } }

//// [input.ts]
class C { #value = 1; method() { [this.#value] = [2]; } }
