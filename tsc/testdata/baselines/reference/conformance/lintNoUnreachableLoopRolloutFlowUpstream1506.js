//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1506.ts] ////

//// [input.ts]
for (a; b; c) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a; b; c) { for (var i = 0; ; i< 10) { foo(); } }
