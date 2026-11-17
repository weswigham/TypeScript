//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunSwitchValueCase1ReturnBreakDefaultWork.ts] ////

//// [input.ts]
function run() { switch (value) { case 1: return; break; default: work(); } }

//// [input.ts]
function run() { switch (value) { case 1:  break; default: work(); } }
