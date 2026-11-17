//// [tests/cases/conformance/lint/rules/consistent-return/lintConsistentReturnRolloutReturnsRulesFunctionRunWhileTrueIfReadyReturn1.ts] ////

//// [input.ts]
function run() { while (true) { if (ready) return 1; } }

//// [input.ts]
function run() { while (true) { if (ready) return 1; } }
