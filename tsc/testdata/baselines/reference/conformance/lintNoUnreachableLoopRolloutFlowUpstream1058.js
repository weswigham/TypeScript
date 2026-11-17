//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1058.ts] ////

//// [input.ts]
for (a = 0; ;) for (a; b; c);

//// [input.ts]
for (a = 0; ;) for (a; b; c);
