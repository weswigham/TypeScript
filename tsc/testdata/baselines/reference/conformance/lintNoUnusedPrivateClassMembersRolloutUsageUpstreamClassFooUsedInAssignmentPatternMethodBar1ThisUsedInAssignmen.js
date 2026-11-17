//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUsedInAssignmentPatternMethodBar1ThisUsedInAssignmen.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #usedInAssignmentPattern;
    method() {
        [bar = 1] = this.#usedInAssignmentPattern;
    }
}

//// [input.ts]
class Foo {
    #usedInAssignmentPattern;
    method() {
        [bar = 1] = this.#usedInAssignmentPattern;
    }
}
