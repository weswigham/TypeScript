//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream612.ts] ////

//// [input.ts]
while (a && b) for (; ; c) if (foo) break;

//// [input.ts]
while (a && b) for (; ; c) if (foo) break;
