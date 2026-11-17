//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream809.ts] ////

//// [input.ts]
for (a; ; c) for (;;) if (foo) break;

//// [input.ts]
for (a; ; c) for (;;) if (foo) break;
