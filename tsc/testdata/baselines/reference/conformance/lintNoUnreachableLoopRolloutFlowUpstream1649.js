//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1649.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for (a of b); break; }

//// [input.ts]
for (a = 0; ; c++) { for (a of b); break; }
