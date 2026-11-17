//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream949.ts] ////

//// [input.ts]
for (; ; c++) for (;;) if (foo) break;

//// [input.ts]
for (; ; c++) for (;;) if (foo) break;
