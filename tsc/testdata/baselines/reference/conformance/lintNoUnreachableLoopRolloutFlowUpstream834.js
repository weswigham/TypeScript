//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream834.ts] ////

//// [input.ts]
for (a = 0; ; c++) for (a; b; c);

//// [input.ts]
for (a = 0; ; c++) for (a; b; c);
