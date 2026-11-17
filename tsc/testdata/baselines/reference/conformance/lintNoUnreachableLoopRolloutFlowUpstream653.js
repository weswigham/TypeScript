//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream653.ts] ////

//// [input.ts]
do { if (foo) { bar(); } else { break; } } while (a && b)

//// [input.ts]
do { if (foo) { bar(); } else { break; } } while (a && b)
