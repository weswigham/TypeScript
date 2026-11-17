//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1477.ts] ////

//// [input.ts]
do { for (var i = 0; ; i< 10) { foo(); } } while (a && b)

//// [input.ts]
do { for (var i = 0; ; i< 10) { foo(); } } while (a && b)
