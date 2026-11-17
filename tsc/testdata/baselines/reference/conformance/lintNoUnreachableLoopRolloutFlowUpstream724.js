//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream724.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) for (; ; c) if (foo) break;

//// [input.ts]
for (var i = 0; i < a.length; i++) for (; ; c) if (foo) break;
