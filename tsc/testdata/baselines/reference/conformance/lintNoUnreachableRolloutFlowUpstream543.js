//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream543.ts] ////

//// [input.ts]
function foo() { var x = 1; while (x) { if (x) break; else continue; x = 2; } }

//// [input.ts]
function foo() { var x = 1; while (x) { if (x) break; else continue; x = 2; } }
