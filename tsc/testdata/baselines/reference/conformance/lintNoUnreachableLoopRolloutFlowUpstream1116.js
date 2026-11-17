//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1116.ts] ////

//// [input.ts]
for (a in b) for (; ; c) if (foo) break;

//// [input.ts]
for (a in b) for (; ; c) if (foo) break;
