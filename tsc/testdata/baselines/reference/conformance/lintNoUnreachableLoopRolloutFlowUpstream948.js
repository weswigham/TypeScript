//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream948.ts] ////

//// [input.ts]
for (; ; c++) for (; ; c) if (foo) break;

//// [input.ts]
for (; ; c++) for (; ; c) if (foo) break;
