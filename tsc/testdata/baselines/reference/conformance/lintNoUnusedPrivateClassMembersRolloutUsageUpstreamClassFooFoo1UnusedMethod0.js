//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooFoo1UnusedMethod0.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    foo = 1
    #unusedMethod() {}
    [0]() {}
}

//// [input.ts]
class Foo {
    foo = 1
    #unusedMethod() {}
    [0]() {}
}
