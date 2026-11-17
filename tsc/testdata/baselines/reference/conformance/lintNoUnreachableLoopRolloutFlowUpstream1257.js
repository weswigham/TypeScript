//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1257.ts] ////

//// [input.ts]
for (a of f(b)) for (;;) if (foo) break;

//// [input.ts]
for (a of f(b)) for (;;) if (foo) break;
