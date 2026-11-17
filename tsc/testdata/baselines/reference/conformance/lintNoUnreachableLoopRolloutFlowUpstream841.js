//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream841.ts] ////

//// [input.ts]
for (a = 0; ; c++) for (a of b);

//// [input.ts]
for (a = 0; ; c++) for (a of b);
