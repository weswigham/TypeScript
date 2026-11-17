//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooRemoveMeUnusedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    // remove me
    #unusedMember = 1;
}

//// [input.ts]
class Foo {
    // remove me
    #unusedMember = 1;
}
