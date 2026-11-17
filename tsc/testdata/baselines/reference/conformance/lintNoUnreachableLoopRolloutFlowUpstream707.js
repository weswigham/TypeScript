//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream707.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { if (foo) break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { if (foo) break; }
