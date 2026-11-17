//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUnusedInAssignmentPatternMethodThisUnusedInAssignmenCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #unusedInAssignmentPattern;
    method() {
        [this.#unusedInAssignmentPattern = 1] = bar;
    }
}

//// [input.ts]
class Foo {
    #unusedInAssignmentPattern;
    method() {
        [this.#unusedInAssignmentPattern = 1] = bar;
    }
}
