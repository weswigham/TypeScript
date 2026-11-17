//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCUnused1KeepFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    #unused1; /* keep */ foo;
}

//// [input.ts]
class C {
    #unused1; /* keep */ foo;
}
