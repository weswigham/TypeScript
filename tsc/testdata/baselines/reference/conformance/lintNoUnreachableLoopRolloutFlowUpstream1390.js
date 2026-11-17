//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1390.ts] ////

//// [input.ts]
while (a) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
while (a) { for (var i = 0; ; i< 10) { foo(); } }
