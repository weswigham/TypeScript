//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream752.ts] ////

//// [input.ts]
for (; b; c) for (; ; c) if (foo) break;

//// [input.ts]
for (; b; c) for (; ; c) if (foo) break;
