//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1970.ts] ////

//// [input.ts]
for (a in f(b)) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a in f(b)) { for (var i = 0; ; i< 10) { foo(); } }
