//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1560.ts] ////

//// [input.ts]
for (; b; c) { for(;;) if (foo) break; break; }

//// [input.ts]
for (; b; c) { for(;;) if (foo) break; break; }
