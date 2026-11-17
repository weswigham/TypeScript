//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1419.ts] ////

//// [input.ts]
while (a && b) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
while (a && b) { for (var i = 0; ; i< 10) { foo(); } }
