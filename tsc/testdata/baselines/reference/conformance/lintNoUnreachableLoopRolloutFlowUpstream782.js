//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream782.ts] ////

//// [input.ts]
for (; b < foo; c++) while (true) if (foo) break;

//// [input.ts]
for (; b < foo; c++) while (true) if (foo) break;
