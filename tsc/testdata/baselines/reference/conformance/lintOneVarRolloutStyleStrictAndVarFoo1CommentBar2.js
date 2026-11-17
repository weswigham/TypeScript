//// [tests/cases/conformance/lint/rules/one-var/lintOneVarRolloutStyleStrictAndVarFoo1CommentBar2.ts] ////

//// [input.ts]
var foo = 1, // comment
    bar = 2;

//// [input.ts]
var foo = 1; // comment
    var bar = 2;
