//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream875.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { if (foo) break; }

//// [input.ts]
for (a = 0; b < foo; ) { if (foo) break; }
