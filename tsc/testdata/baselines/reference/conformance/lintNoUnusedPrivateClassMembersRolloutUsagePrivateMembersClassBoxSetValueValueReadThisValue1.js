//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsagePrivateMembersClassBoxSetValueValueReadThisValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { set #value(value) {} read() { this.#value = 1; } }

//// [input.ts]
class Box { set #value(value) {} read() { this.#value = 1; } }
