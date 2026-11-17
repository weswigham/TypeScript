//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1229.ts] ////

//// [input.ts]
for (a of b) for (;;) if (foo) break;

//// [input.ts]
for (a of b) for (;;) if (foo) break;
