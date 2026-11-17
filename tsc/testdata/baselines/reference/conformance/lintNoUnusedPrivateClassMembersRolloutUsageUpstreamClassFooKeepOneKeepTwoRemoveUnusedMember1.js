//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooKeepOneKeepTwoRemoveUnusedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    // keep one
    // keep two

    /** remove */
    #unusedMember = 1;
}

//// [input.ts]
class Foo {
    // keep one
    // keep two

    /** remove */
    #unusedMember = 1;
}
