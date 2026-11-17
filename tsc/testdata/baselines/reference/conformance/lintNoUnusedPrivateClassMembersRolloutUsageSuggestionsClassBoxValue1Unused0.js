//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageSuggestionsClassBoxValue1Unused0.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box {
    value = 1
    #unused() {}
    [0]() {}
}

//// [input.ts]
class Box {
    value = 1
    #unused() {}
    [0]() {}
}
