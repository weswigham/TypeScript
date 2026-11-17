//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1825.ts] ////

//// [input.ts]
for (; b < foo; ) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (; b < foo; ) { for (var i = 0; ; i< 10) { foo(); } }
