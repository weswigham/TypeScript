//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUsedMember42MethodReturnThisUsedMember.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #usedMember = 42;
    method() {
        return this.#usedMember;
    }
}

//// [input.ts]
class Foo {
    #usedMember = 42;
    method() {
        return this.#usedMember;
    }
}
