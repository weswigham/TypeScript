//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooFoo1KeepThisUnusedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    foo = 1; // keep this
    #unusedMember = 1;
}

//// [input.ts]
class Foo {
    foo = 1; // keep this
    #unusedMember = 1;
}
