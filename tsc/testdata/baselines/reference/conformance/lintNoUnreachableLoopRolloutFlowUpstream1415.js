//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1415.ts] ////

//// [input.ts]
while (a && b) { for(;;) if (foo) break; break; }

//// [input.ts]
while (a && b) { for(;;) if (foo) break; break; }
