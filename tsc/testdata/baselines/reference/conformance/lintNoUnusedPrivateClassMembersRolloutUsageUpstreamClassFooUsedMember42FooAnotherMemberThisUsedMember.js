//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUsedMember42FooAnotherMemberThisUsedMember.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #usedMember = 42;
    foo() {
        anotherMember = this.#usedMember;
    }
}

//// [input.ts]
class Foo {
    #usedMember = 42;
    foo() {
        anotherMember = this.#usedMember;
    }
}
