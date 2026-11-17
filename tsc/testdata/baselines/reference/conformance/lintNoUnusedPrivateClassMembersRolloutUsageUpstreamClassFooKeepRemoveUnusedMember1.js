//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooKeepRemoveUnusedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    // keep

    /** remove */
    #unusedMember = 1;
}

//// [input.ts]
class Foo {
    // keep

    /** remove */
    #unusedMember = 1;
}
