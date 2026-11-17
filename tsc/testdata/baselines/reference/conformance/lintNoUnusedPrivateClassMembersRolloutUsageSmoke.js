//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageSmoke.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value = 0; method() { this.#value = 1; } }

//// [input.ts]
class Box { #value = 0; method() { this.#value = 1; } }
