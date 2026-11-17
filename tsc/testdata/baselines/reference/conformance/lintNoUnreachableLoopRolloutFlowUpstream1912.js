//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1912.ts] ////

//// [input.ts]
for (;;) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (;;) { for (var i = 0; ; i< 10) { foo(); } }
