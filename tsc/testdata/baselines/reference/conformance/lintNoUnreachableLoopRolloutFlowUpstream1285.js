//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1285.ts] ////

//// [input.ts]
for ({ a, b } of c) for (;;) if (foo) break;

//// [input.ts]
for ({ a, b } of c) for (;;) if (foo) break;
