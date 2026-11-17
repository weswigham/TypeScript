//// [tests/cases/conformance/lint/rules/no-else-return/lintNoElseReturnRolloutReturnsRemovalFunctionRunWhileReadyIfOtherReturn1ElseWork.ts] ////

//// [input.ts]
function run() { while (ready) if (other) return 1; else work(); }

//// [input.ts]
function run() { while (ready) if (other) return 1; else work(); }
