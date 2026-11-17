//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadConsumeThisValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { consume(this.#value++); } }

//// [input.ts]
class Box { #value; read() { consume(this.#value++); } }
