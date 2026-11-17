//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream819.ts] ////

//// [input.ts]
for (a = 0; ; c++) { if (foo) break; }

//// [input.ts]
for (a = 0; ; c++) { if (foo) break; }
