//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFirstClassSecondUnusedMemberInSecondClass5.ts] ////

//// [globals.d.ts]

//// [input.ts]
class First {}
class Second {
    #unusedMemberInSecondClass = 5;
}

//// [input.ts]
class First {}
class Second {
    #unusedMemberInSecondClass = 5;
}
