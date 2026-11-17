//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1941.ts] ////

//// [input.ts]
for (a in b) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a in b) { for (var i = 0; ; i< 10) { foo(); } }
