//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1648.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for (a in b); break; }

//// [input.ts]
for (a = 0; ; c++) { for (a in b); break; }
