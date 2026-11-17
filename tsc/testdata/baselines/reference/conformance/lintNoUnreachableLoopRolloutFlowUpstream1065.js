//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1065.ts] ////

//// [input.ts]
for (a = 0; ;) for (a of b);

//// [input.ts]
for (a = 0; ;) for (a of b);
