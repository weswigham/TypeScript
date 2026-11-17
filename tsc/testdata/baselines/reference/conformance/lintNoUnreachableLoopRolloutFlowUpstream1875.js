//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1875.ts] ////

//// [input.ts]
for (a = 0; ;) { do ; while (a) break; }

//// [input.ts]
for (a = 0; ;) { do ; while (a) break; }
