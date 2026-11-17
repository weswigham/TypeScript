//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1523.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { break; continue; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { break; continue; }
