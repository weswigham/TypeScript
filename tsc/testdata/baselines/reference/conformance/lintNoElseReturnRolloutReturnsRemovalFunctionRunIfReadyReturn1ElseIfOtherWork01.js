//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunIfReadyReturn1ElseIfOtherWork01.ts] ////

//// [input.ts]
function run() { if (ready) return 1; else if (other) work(); }

//// [input.ts]
function run() { if (ready) return 1; if (other) work(); }
