//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream830.ts] ////

//// [input.ts]
for (a = 0; ; c++) (() => a)();

//// [input.ts]
for (a = 0; ; c++) (() => a)();
