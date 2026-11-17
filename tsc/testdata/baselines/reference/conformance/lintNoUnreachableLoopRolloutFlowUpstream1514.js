//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1514.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { foo(); break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { foo(); break; }
