//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1908.ts] ////

//// [input.ts]
for (;;) { for(;;) if (foo) break; break; }

//// [input.ts]
for (;;) { for(;;) if (foo) break; break; }
