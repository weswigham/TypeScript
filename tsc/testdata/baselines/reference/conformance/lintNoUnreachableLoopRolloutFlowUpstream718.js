//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream718.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) (() => a)();

//// [input.ts]
for (var i = 0; i < a.length; i++) (() => a)();
