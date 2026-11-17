//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1502.ts] ////

//// [input.ts]
for (a; b; c) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a; b; c) { for(;;) if (foo) break; break; }
