//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1526.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { while (a); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { while (a); break; }
