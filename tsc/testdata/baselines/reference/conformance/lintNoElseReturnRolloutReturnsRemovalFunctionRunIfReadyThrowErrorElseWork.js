//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunIfReadyThrowErrorElseWork.ts] ////

//// [input.ts]
function run() { if (ready) throw error; else work(); }

//// [input.ts]
function run() { if (ready) throw error; else work(); }
