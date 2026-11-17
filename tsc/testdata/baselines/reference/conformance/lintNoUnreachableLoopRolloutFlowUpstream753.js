//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream753.ts] ////

//// [input.ts]
for (; b; c) for (;;) if (foo) break;

//// [input.ts]
for (; b; c) for (;;) if (foo) break;
