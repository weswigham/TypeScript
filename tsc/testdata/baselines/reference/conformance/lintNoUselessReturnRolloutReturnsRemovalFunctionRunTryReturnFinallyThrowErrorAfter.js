//// [tests/cases/conformance/lint/rules/no-useless-return/lintNoUselessReturnRolloutReturnsRemovalFunctionRunTryReturnFinallyThrowErrorAfter.ts] ////

//// [input.ts]
function run() { try { return; } finally { throw error; } after(); }

//// [input.ts]
function run() { try {  } finally { throw error; } after(); }
