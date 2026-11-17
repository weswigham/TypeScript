//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream512.ts] ////

//// [input.ts]
function foo() { var x = 1; for (x in {}) { return; } x = 2; }

//// [input.ts]
function foo() { var x = 1; for (x in {}) { return; } x = 2; }
