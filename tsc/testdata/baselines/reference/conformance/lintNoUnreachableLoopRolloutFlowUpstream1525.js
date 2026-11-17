//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1525.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { (() => a)(); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { (() => a)(); break; }
