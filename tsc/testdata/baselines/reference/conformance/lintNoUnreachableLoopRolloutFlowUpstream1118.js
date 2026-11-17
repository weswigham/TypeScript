//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1118.ts] ////

//// [input.ts]
for (a in b) while (true) if (foo) break;

//// [input.ts]
for (a in b) while (true) if (foo) break;
