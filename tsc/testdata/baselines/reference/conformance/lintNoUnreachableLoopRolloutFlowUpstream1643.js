//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1643.ts] ////

//// [input.ts]
for (a = 0; ; c++) { do ; while (a) break; }

//// [input.ts]
for (a = 0; ; c++) { do ; while (a) break; }
