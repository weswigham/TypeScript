//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1313.ts] ////

//// [input.ts]
for (var a of f(b)) for (;;) if (foo) break;

//// [input.ts]
for (var a of f(b)) for (;;) if (foo) break;
