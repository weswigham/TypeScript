//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadThisValueOtherInput.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { ({[this.#value]: other} = input); } }

//// [input.ts]
class Box { #value; read() { ({[this.#value]: other} = input); } }
