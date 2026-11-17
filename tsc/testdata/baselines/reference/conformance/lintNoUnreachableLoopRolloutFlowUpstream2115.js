//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2115.ts] ////

//// [input.ts]
for ({ a, b } of c) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for ({ a, b } of c) { for (var i = 0; ; i< 10) { foo(); } }
