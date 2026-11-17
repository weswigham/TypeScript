//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream877.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (a = 0; b < foo; ) { if (foo) { bar(); } else { break; } }
