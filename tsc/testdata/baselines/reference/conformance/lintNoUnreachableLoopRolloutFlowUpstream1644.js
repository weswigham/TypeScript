//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1644.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for (a; b; c); break; }

//// [input.ts]
for (a = 0; ; c++) { for (a; b; c); break; }
