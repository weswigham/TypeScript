//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream719.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { (() => a)() }

//// [input.ts]
for (var i = 0; i < a.length; i++) { (() => a)() }
