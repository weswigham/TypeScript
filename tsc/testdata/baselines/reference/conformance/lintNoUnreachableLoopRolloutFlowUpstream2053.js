//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2053.ts] ////

//// [input.ts]
for (a of b) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a of b) { for(;;) if (foo) break; break; }
