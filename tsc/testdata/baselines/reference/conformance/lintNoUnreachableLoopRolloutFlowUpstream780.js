//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream780.ts] ////

//// [input.ts]
for (; b < foo; c++) for (; ; c) if (foo) break;

//// [input.ts]
for (; b < foo; c++) for (; ; c) if (foo) break;
