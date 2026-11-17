//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamWhileAFunctionFooBBB1Foo.ts] ////

//// [globals.d.ts]

//// [input.ts]
while (a) {
    function foo(b) {
        b = b + 1;
    }
    foo()
}

//// [input.ts]
while (a) {
    function foo(b) {
        b = b + 1;
    }
    foo()
}
