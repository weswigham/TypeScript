//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadFirstThisValueInput.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { ({first: this.#value} = input); } }

//// [input.ts]
class Box { #value; read() { ({first: this.#value} = input); } }
