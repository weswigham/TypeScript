//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1527.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { do ; while (a) break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { do ; while (a) break; }
