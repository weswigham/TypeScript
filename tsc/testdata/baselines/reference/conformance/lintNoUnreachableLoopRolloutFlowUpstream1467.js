//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1467.ts] ////

//// [input.ts]
do { (() => a)(); break; } while (a && b)

//// [input.ts]
do { (() => a)(); break; } while (a && b)
