//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1061.ts] ////

//// [input.ts]
for (a = 0; ;) for (;;) if (foo) break;

//// [input.ts]
for (a = 0; ;) for (;;) if (foo) break;
