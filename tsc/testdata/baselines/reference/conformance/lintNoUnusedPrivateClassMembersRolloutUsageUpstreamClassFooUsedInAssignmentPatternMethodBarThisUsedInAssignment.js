//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUsedInAssignmentPatternMethodBarThisUsedInAssignment.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #usedInAssignmentPattern;
    method() {
        [bar] = this.#usedInAssignmentPattern;
    }
}

//// [input.ts]
class Foo {
    #usedInAssignmentPattern;
    method() {
        [bar] = this.#usedInAssignmentPattern;
    }
}
