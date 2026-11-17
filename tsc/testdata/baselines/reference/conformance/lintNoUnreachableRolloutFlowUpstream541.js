//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream541.ts] ////

//// [input.ts]
function foo() { var x = 1; try { } finally { return; } x = 2; }

//// [input.ts]
function foo() { var x = 1; try { } finally { return; } x = 2; }
