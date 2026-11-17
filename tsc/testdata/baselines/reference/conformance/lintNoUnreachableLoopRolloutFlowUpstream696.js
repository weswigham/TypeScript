//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream696.ts] ////

//// [input.ts]
for (a; b; c) for (; ; c) if (foo) break;

//// [input.ts]
for (a; b; c) for (; ; c) if (foo) break;
