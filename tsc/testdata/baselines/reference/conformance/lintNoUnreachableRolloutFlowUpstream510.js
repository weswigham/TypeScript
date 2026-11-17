//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream510.ts] ////

//// [input.ts]
function foo() { var x = 1; switch (x) { case 0: break; default: return; } x = 2; }

//// [input.ts]
function foo() { var x = 1; switch (x) { case 0: break; default: return; } x = 2; }
