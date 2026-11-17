//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1767.ts] ////

//// [input.ts]
for (; ; c++) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (; ; c++) { for (var i = 0; ; i< 10) { foo(); } }
