//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUnusedMethodUsedMethodReturn42PublicMethodReturnThis.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #unusedMethod() {}
    #usedMethod() {
        return 42;
    }
    publicMethod() {
        return this.#usedMethod();
    }
}

//// [input.ts]
class Foo {
    #unusedMethod() {}
    #usedMethod() {
        return 42;
    }
    publicMethod() {
        return this.#usedMethod();
    }
}
