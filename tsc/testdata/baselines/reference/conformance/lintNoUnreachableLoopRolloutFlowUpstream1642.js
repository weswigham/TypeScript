//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1642.ts] ////

//// [input.ts]
for (a = 0; ; c++) { while (a); break; }

//// [input.ts]
for (a = 0; ; c++) { while (a); break; }
