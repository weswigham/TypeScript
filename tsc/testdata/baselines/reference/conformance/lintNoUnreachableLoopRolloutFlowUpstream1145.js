//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1145.ts] ////

//// [input.ts]
for (a in f(b)) for (;;) if (foo) break;

//// [input.ts]
for (a in f(b)) for (;;) if (foo) break;
