//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadForThisValueOfInput.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { for (this.#value of input) {} } }

//// [input.ts]
class Box { #value; read() { for (this.#value of input) {} } }
