//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream836.ts] ////

//// [input.ts]
for (a = 0; ; c++) for (; ; c) if (foo) break;

//// [input.ts]
for (a = 0; ; c++) for (; ; c) if (foo) break;
