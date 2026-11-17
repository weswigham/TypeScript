//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream723.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) for (; b;);

//// [input.ts]
for (var i = 0; i < a.length; i++) for (; b;);
