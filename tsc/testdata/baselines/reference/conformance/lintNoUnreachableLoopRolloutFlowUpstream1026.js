//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1026.ts] ////

//// [input.ts]
for (a; ;) (() => a)();

//// [input.ts]
for (a; ;) (() => a)();
