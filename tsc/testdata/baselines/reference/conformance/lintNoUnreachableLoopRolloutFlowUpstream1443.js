//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1443.ts] ////

//// [input.ts]
do { for (; ; c) if (foo) break; break; } while (a)

//// [input.ts]
do { for (; ; c) if (foo) break; break; } while (a)
