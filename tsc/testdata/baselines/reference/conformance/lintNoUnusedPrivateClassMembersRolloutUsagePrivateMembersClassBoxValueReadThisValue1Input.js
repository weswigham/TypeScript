//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadThisValue1Input.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { [this.#value = 1] = input; } }

//// [input.ts]
class Box { #value; read() { [this.#value = 1] = input; } }
