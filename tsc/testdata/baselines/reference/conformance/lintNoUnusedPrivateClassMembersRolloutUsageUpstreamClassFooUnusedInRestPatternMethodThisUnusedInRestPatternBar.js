//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUnusedInRestPatternMethodThisUnusedInRestPatternBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #unusedInRestPattern;
    method() {
        [...this.#unusedInRestPattern] = bar;
    }
}

//// [input.ts]
class Foo {
    #unusedInRestPattern;
    method() {
        [...this.#unusedInRestPattern] = bar;
    }
}
