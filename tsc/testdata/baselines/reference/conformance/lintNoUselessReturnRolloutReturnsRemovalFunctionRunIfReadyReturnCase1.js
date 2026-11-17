//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunIfReadyReturnCase1.ts] ////

//// [input.ts]
function run() { if (ready) { return; } }

//// [input.ts]
function run() { if (ready) {  } }
