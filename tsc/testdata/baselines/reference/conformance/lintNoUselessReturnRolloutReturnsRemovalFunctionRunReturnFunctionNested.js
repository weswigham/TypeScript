//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunReturnFunctionNested.ts] ////

//// [input.ts]
function run() { return; function nested() {} }

//// [input.ts]
function run() {  function nested() {} }
