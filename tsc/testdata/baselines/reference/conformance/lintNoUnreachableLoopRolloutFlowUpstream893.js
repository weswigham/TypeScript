//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream893.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (;;) if (foo) break;

//// [input.ts]
for (a = 0; b < foo; ) for (;;) if (foo) break;
