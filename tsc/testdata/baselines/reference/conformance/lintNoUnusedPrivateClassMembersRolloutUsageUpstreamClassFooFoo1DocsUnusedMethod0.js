//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooFoo1DocsUnusedMethod0.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    foo = 1
    /** docs */
    #unusedMethod() {}
    [0]() {}
}

//// [input.ts]
class Foo {
    foo = 1
    /** docs */
    #unusedMethod() {}
    [0]() {}
}
