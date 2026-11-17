//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1515.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { break; foo(); }

//// [input.ts]
for (var i = 0; i < a.length; i++) { break; foo(); }
