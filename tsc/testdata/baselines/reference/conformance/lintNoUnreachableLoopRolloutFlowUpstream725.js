//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream725.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) for (;;) if (foo) break;

//// [input.ts]
for (var i = 0; i < a.length; i++) for (;;) if (foo) break;
