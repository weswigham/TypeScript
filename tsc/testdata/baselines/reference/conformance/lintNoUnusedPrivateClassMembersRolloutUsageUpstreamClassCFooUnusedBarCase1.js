//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCFooUnusedBarCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    foo
    #unused
    [bar]
}

//// [input.ts]
class C {
    foo
    #unused
    [bar]
}
