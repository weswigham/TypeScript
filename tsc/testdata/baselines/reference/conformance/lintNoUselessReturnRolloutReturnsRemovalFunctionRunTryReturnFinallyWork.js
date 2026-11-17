//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunTryReturnFinallyWork.ts] ////

//// [input.ts]
function run() { try { return; } finally { work(); } }

//// [input.ts]
function run() { try {  } finally { work(); } }
