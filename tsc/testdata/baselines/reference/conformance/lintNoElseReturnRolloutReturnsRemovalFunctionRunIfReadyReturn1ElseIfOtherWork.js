//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunIfReadyReturn1ElseIfOtherWork.ts] ////

//// [input.ts]
function run() { if (ready) return 1; else if (other) work(); }

//// [input.ts]
function run() { if (ready) return 1; else if (other) work(); }
