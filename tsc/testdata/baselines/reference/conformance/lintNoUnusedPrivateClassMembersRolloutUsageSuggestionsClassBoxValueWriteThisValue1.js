//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageSuggestionsClassBoxValueWriteThisValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; write() { this.#value = 1; } }

//// [input.ts]
class Box { #value; write() { this.#value = 1; } }
