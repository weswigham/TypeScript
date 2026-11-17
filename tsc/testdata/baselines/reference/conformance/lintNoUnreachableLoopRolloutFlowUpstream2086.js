//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2086.ts] ////

//// [input.ts]
for (a of f(b)) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a of f(b)) { for (var i = 0; ; i< 10) { foo(); } }
