//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadConsumeThisValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { consume(this.#value += 1); } }

//// [input.ts]
class Box { #value; read() { consume(this.#value += 1); } }
