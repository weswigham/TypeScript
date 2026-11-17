//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunSwitchValueCase1ReturnDefaultWork.ts] ////

//// [input.ts]
function run() { switch (value) { case 1: return; default: work(); } }

//// [input.ts]
function run() { switch (value) { case 1: return; default: work(); } }
