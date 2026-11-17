//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1032.ts] ////

//// [input.ts]
for (a; ;) for (; ; c) if (foo) break;

//// [input.ts]
for (a; ;) for (; ; c) if (foo) break;
