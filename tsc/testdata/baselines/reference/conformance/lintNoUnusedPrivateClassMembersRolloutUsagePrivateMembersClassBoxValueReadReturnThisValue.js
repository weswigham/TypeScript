//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadReturnThisValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { return this.#value; } }

//// [input.ts]
class Box { #value; read() { return this.#value; } }
