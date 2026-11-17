//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionSomeFunctionVarA0IForI0I2IAMyFunctionASomeFunction.ts] ////

//// [globals.d.ts]

//// [input.ts]
function someFunction() {
    var a = 0, i;
    for (i = 0; i < 2; i++) {
        a = myFunction(a);
    }
}
someFunction();

//// [input.ts]
function someFunction() {
    var a = 0, i;
    for (i = 0; i < 2; i++) {
        a = myFunction(a);
    }
}
someFunction();
