//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1528.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (a; b; c); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (a; b; c); break; }
