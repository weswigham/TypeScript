//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1531.ts] ////

//// [input.ts]
for (var i = 0; i < a.length; i++) { for(;;) if (foo) break; break; }

//// [input.ts]
for (var i = 0; i < a.length; i++) { for(;;) if (foo) break; break; }
