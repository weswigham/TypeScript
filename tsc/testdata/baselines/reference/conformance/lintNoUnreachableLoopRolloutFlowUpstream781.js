//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream781.ts] ////

//// [input.ts]
for (; b < foo; c++) for (;;) if (foo) break;

//// [input.ts]
for (; b < foo; c++) for (;;) if (foo) break;
