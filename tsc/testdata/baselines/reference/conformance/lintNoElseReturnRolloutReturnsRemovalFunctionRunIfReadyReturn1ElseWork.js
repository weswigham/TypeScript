//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunIfReadyReturn1ElseWork.ts] ////

//// [input.ts]
function run() { if (ready) { return 1; } else { work(); } }

//// [input.ts]
function run() { if (ready) { return 1; }  work();  }
