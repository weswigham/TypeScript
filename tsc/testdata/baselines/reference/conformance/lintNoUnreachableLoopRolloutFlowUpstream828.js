//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream828.ts] ////

//// [input.ts]
for (a = 0; ; c++) () => a;

//// [input.ts]
for (a = 0; ; c++) () => a;
