//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream715.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { continue; break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { continue; break; }
