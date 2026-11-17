//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2144.ts] ////

//// [input.ts]
for (var a of f(b)) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (var a of f(b)) { for (var i = 0; ; i< 10) { foo(); } }
