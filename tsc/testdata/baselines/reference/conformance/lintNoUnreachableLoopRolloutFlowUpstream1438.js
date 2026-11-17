//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1438.ts] ////

//// [input.ts]
do { (() => a)(); break; } while (a)

//// [input.ts]
do { (() => a)(); break; } while (a)
