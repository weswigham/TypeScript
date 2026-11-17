//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream864.ts] ////

//// [input.ts]
for (a; b;) for (; ; c) if (foo) break;

//// [input.ts]
for (a; b;) for (; ; c) if (foo) break;
