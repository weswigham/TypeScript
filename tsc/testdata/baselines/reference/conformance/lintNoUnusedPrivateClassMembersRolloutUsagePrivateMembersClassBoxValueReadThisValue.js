//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadThisValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { this.#value++; } }

//// [input.ts]
class Box { #value; read() { this.#value++; } }
