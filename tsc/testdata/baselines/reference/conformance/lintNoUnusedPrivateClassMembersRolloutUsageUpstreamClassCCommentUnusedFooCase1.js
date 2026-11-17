//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintNoUnusedPrivateClassMembersRolloutUsageUpstreamClassCCommentUnusedFooCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class C {
    // comment
    #unused; /*
    */ foo;
}

//// [input.ts]
class C {
    // comment
    #unused; /*
    */ foo;
}
