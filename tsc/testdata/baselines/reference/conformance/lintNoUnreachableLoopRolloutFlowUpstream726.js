//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream726.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) while (true) if (foo) break;

//// [input.ts]
for (var i = 0; i < a.length; i++) while (true) if (foo) break;
