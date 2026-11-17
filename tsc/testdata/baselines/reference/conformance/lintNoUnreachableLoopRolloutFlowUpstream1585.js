//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1585.ts] ////

//// [input.ts]
for (; b < foo; c++) { do ; while (a) break; }

//// [input.ts]
for (; b < foo; c++) { do ; while (a) break; }
