//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1532.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (a in b); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (a in b); break; }
