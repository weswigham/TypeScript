//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1854.ts] ////

//// [input.ts]
for (a; ;) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a; ;) { for (var i = 0; ; i< 10) { foo(); } }
