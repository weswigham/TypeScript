//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream894.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) while (true) if (foo) break;

//// [input.ts]
for (a = 0; b < foo; ) while (true) if (foo) break;
