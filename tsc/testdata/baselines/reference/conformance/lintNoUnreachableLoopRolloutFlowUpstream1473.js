//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1473.ts] ////

//// [input.ts]
do { for(;;) if (foo) break; break; } while (a && b)

//// [input.ts]
do { for(;;) if (foo) break; break; } while (a && b)
