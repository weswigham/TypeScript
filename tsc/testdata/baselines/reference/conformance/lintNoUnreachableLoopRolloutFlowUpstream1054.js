//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1054.ts] ////

//// [input.ts]
for (a = 0; ;) (() => a)();

//// [input.ts]
for (a = 0; ;) (() => a)();
