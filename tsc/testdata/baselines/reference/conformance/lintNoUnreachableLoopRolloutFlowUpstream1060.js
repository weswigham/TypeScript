//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1060.ts] ////

//// [input.ts]
for (a = 0; ;) for (; ; c) if (foo) break;

//// [input.ts]
for (a = 0; ;) for (; ; c) if (foo) break;
