//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2028.ts] ////

//// [input.ts]
for (let a in f(b)) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (let a in f(b)) { for (var i = 0; ; i< 10) { foo(); } }
