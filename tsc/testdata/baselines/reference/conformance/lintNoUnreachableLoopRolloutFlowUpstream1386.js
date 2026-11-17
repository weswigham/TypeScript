//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1386.ts] ////

//// [input.ts]
while (a) { for(;;) if (foo) break; break; }

//// [input.ts]
while (a) { for(;;) if (foo) break; break; }
