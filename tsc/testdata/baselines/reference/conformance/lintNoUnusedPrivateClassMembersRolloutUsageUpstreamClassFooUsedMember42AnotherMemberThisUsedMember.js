//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooUsedMember42AnotherMemberThisUsedMember.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    #usedMember = 42;
    anotherMember = this.#usedMember;
}

//// [input.ts]
class Foo {
    #usedMember = 42;
    anotherMember = this.#usedMember;
}
