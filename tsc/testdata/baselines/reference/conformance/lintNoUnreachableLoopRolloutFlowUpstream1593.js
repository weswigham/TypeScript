//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1593.ts] ////

//// [input.ts]
for (; b < foo; c++) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (; b < foo; c++) { for (var i = 0; ; i< 10) { foo(); } }
