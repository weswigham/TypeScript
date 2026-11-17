//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1110.ts] ////

//// [input.ts]
for (a in b) (() => a)();

//// [input.ts]
for (a in b) (() => a)();
