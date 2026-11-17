//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream697.ts] ////

//// [input.ts]
for (a; b; c) for (;;) if (foo) break;

//// [input.ts]
for (a; b; c) for (;;) if (foo) break;
