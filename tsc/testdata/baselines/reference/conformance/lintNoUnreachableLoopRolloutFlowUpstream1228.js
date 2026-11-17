//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1228.ts] ////

//// [input.ts]
for (a of b) for (; ; c) if (foo) break;

//// [input.ts]
for (a of b) for (; ; c) if (foo) break;
