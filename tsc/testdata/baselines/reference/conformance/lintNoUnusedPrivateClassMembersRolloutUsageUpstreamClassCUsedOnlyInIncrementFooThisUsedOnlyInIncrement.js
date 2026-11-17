//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUsedOnlyInIncrementFooThisUsedOnlyInIncrement.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #usedOnlyInIncrement;

    foo() {
        this.#usedOnlyInIncrement++;
    }
}

//// [input.ts]
class C {
    #usedOnlyInIncrement;

    foo() {
        this.#usedOnlyInIncrement++;
    }
}
