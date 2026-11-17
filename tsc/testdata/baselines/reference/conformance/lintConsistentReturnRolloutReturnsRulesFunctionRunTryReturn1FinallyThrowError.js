//// [tests/cases/conformance/lint/rules/consistent-return/lintConsistentReturnRolloutReturnsRulesFunctionRunTryReturn1FinallyThrowError.ts] ////

//// [input.ts]
function run() { try { return 1; } finally { throw error; } }

//// [input.ts]
function run() { try { return 1; } finally { throw error; } }
