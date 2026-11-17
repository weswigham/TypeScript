//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1535.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (var i = 0; ; i< 10) { foo(); } }
