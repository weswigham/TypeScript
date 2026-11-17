//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1533.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (a of b); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (a of b); break; }
