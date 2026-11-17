//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream709.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { if (foo) { bar(); } else { break; } }

//// [input.ts]
for (var i = 0; i < a.length; i++) { if (foo) { bar(); } else { break; } }
