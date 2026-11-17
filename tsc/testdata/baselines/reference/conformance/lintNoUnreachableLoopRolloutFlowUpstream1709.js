//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1709.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a = 0; b < foo; ) { for (var i = 0; ; i< 10) { foo(); } }
