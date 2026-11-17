//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunWhileReadyReturn.ts] ////

//// [input.ts]
function run() { while (ready) { return; } }

//// [input.ts]
function run() { while (ready) { return; } }
