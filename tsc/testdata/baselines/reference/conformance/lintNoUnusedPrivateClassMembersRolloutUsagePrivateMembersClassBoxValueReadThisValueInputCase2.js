//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadThisValueInputCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { [this.#value] = input; } }

//// [input.ts]
class Box { #value; read() { [this.#value] = input; } }
