//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream663.ts] ////

//// [input.ts]
do { (() => a)() } while (a && b)

//// [input.ts]
do { (() => a)() } while (a && b)
