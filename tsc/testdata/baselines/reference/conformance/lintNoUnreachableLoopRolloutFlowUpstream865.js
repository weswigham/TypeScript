//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream865.ts] ////

//// [input.ts]
for (a; b;) for (;;) if (foo) break;

//// [input.ts]
for (a; b;) for (;;) if (foo) break;
