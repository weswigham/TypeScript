//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxValueReadReturnValueInObject.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { #value; read() { return #value in object; } }

//// [input.ts]
class Box { #value; read() { return #value in object; } }
