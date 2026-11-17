//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUsedOnlyInWriteStatement5MethodThisUsedOnlyInWriteSt.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #usedOnlyInWriteStatement = 5;
    method() {
        this.#usedOnlyInWriteStatement += 42;
    }
}

//// [input.ts]
class Foo {
    #usedOnlyInWriteStatement = 5;
    method() {
        this.#usedOnlyInWriteStatement += 42;
    }
}
