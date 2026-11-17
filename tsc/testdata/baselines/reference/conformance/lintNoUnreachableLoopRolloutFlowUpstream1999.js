//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1999.ts] ////

//// [input.ts]
for (var a in b) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (var a in b) { for (var i = 0; ; i< 10) { foo(); } }
