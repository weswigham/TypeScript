//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1529.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (; b;); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { for (; b;); break; }
