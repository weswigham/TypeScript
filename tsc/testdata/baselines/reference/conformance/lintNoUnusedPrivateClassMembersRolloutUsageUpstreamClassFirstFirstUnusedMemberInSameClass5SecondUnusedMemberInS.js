//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFirstFirstUnusedMemberInSameClass5SecondUnusedMemberInS.ts] ////

//// [globals.d.ts]

//// [input.ts]
class First {
    #firstUnusedMemberInSameClass = 5;
    #secondUnusedMemberInSameClass = 5;
}

//// [input.ts]
class First {
    #firstUnusedMemberInSameClass = 5;
    #secondUnusedMemberInSameClass = 5;
}
