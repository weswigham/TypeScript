//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream838.ts] ////

//// [input.ts]
for (a = 0; ; c++) while (true) if (foo) break;

//// [input.ts]
for (a = 0; ; c++) while (true) if (foo) break;
