//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooDocsUnusedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    /** docs */
    #unusedMember = 1;
}

//// [input.ts]
class Foo {
    /** docs */
    #unusedMember = 1;
}
