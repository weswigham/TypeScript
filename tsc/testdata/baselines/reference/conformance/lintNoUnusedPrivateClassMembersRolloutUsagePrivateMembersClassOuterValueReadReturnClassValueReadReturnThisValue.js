//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassOuterValueReadReturnClassValueReadReturnThisValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Outer { #value; read() { return class { #value; read() { return this.#value; } }; } }

//// [input.ts]
class Outer { #value; read() { return class { #value; read() { return this.#value; } }; } }
