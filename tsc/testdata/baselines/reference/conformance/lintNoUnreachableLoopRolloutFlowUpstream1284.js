//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1284.ts] ////

//// [input.ts]
for ({ a, b } of c) for (; ; c) if (foo) break;

//// [input.ts]
for ({ a, b } of c) for (; ; c) if (foo) break;
