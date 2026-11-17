//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream614.ts] ////

//// [input.ts]
while (a && b) while (true) if (foo) break;

//// [input.ts]
while (a && b) while (true) if (foo) break;
