//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1062.ts] ////

//// [input.ts]
for (a = 0; ;) while (true) if (foo) break;

//// [input.ts]
for (a = 0; ;) while (true) if (foo) break;
