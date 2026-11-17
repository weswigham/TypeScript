//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1230.ts] ////

//// [input.ts]
for (a of b) while (true) if (foo) break;

//// [input.ts]
for (a of b) while (true) if (foo) break;
