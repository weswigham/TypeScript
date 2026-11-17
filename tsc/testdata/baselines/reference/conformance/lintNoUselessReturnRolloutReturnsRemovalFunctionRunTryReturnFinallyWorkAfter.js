//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunTryReturnFinallyWorkAfter.ts] ////

//// [input.ts]
function run() { try { return; } finally { work(); } after(); }

//// [input.ts]
function run() { try { return; } finally { work(); } after(); }
