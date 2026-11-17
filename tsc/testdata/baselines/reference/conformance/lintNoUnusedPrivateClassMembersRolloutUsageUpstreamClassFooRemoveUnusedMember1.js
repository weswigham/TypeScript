//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassFooRemoveUnusedMember1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Foo {
    /* remove */ #unusedMember = 1;
}

//// [input.ts]
class Foo {
    /* remove */ #unusedMember = 1;
}
