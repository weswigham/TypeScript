//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream808.ts] ////

//// [input.ts]
for (a; ; c) for (; ; c) if (foo) break;

//// [input.ts]
for (a; ; c) for (; ; c) if (foo) break;
