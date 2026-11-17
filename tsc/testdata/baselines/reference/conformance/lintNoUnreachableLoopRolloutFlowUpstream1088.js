//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1088.ts] ////

//// [input.ts]
for (;;) for (; ; c) if (foo) break;

//// [input.ts]
for (;;) for (; ; c) if (foo) break;
