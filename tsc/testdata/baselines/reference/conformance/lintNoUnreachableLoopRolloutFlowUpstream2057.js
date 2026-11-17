//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2057.ts] ////

//// [input.ts]
for (a of b) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a of b) { for (var i = 0; ; i< 10) { foo(); } }
