//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1651.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a = 0; ; c++) { for (var i = 0; ; i< 10) { foo(); } }
