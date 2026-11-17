//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1850.ts] ////

//// [input.ts]
for (a; ;) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a; ;) { for(;;) if (foo) break; break; }
