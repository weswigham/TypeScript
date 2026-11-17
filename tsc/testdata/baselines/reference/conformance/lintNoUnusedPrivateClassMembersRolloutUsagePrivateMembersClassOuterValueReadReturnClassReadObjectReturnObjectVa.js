//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassOuterValueReadReturnClassReadObjectReturnObjectVa.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Outer { #value; read() { return class { read(object) { return object.#value; } }; } }

//// [input.ts]
class Outer { #value; read() { return class { read(object) { return object.#value; } }; } }
