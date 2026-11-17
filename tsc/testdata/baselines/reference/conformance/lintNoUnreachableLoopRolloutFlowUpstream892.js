//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream892.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (; ; c) if (foo) break;

//// [input.ts]
for (a = 0; b < foo; ) for (; ; c) if (foo) break;
