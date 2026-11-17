//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1705.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a = 0; b < foo; ) { for(;;) if (foo) break; break; }
