//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1883.ts] ////

//// [input.ts]
for (a = 0; ;) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a = 0; ;) { for (var i = 0; ; i< 10) { foo(); } }
