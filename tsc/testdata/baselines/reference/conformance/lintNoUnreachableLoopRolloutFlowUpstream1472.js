//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1472.ts] ////

//// [input.ts]
do { for (; ; c) if (foo) break; break; } while (a && b)

//// [input.ts]
do { for (; ; c) if (foo) break; break; } while (a && b)
