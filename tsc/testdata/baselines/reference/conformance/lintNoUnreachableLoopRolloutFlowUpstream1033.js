//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1033.ts] ////

//// [input.ts]
for (a; ;) for (;;) if (foo) break;

//// [input.ts]
for (a; ;) for (;;) if (foo) break;
