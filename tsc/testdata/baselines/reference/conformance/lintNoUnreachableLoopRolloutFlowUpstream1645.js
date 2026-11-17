//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1645.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for (; b;); break; }

//// [input.ts]
for (a = 0; ; c++) { for (; b;); break; }
