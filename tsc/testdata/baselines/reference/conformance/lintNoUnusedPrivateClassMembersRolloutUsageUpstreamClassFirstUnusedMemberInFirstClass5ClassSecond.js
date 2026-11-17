//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFirstUnusedMemberInFirstClass5ClassSecond.ts] ////

//// [globals.d.ts]

//// [input.ts]
class First {
    #unusedMemberInFirstClass = 5;
}
class Second {}

//// [input.ts]
class First {
    #unusedMemberInFirstClass = 5;
}
class Second {}
