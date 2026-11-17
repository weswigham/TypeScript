//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream837.ts] ////

//// [input.ts]
for (a = 0; ; c++) for (;;) if (foo) break;

//// [input.ts]
for (a = 0; ; c++) for (;;) if (foo) break;
