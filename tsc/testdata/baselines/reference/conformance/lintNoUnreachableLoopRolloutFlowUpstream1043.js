//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1043.ts] ////

//// [input.ts]
for (a = 0; ;) { if (foo) break; }

//// [input.ts]
for (a = 0; ;) { if (foo) break; }
