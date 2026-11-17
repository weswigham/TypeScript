//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooKeepUnusedMember1Foo1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    /* keep */ #unusedMember = 1; foo = 1
}

//// [input.ts]
class Foo {
    /* keep */ #unusedMember = 1; foo = 1
}
