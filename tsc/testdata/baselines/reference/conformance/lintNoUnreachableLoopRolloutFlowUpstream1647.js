//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1647.ts] ////

//// [input.ts]
for (a = 0; ; c++) { for(;;) if (foo) break; break; }

//// [input.ts]
for (a = 0; ; c++) { for(;;) if (foo) break; break; }
