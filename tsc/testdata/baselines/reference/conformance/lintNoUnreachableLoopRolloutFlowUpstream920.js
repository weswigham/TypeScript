//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream920.ts] ////

//// [input.ts]
for (; ; c) for (; ; c) if (foo) break;

//// [input.ts]
for (; ; c) for (; ; c) if (foo) break;
