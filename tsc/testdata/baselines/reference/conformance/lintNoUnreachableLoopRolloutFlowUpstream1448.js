//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1448.ts] ////

//// [input.ts]
do { for (var i = 0; ; i< 10) { foo(); } } while (a)

//// [input.ts]
do { for (var i = 0; ; i< 10) { foo(); } } while (a)
