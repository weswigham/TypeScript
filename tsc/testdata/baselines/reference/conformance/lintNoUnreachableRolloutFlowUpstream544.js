//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream544.ts] ////

//// [input.ts]
function foo() { var x = 1; for (;;) { if (x) continue; } x = 2; }

//// [input.ts]
function foo() { var x = 1; for (;;) { if (x) continue; } x = 2; }
