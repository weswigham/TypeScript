//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream538.ts] ////

//// [input.ts]
function foo() { var x = 1; if (x) { return; } else { throw e; } x = 2; }

//// [input.ts]
function foo() { var x = 1; if (x) { return; } else { throw e; } x = 2; }
