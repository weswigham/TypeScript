//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2185.ts] ////

//// [input.ts]
for (;;) { for (var i = 1; i < 10; i ++) break; if (foo) break; continue; }

//// [input.ts]
for (;;) { for (var i = 1; i < 10; i ++) break; if (foo) break; continue; }
