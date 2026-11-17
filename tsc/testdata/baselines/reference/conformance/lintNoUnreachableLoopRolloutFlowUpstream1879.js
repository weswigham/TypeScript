//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1879.ts] ////

//// [input.ts]
for (a = 0; ;) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a = 0; ;) { for(;;) if (foo) break; break; }
