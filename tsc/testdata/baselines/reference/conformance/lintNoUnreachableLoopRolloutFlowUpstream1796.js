//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1796.ts] ////

//// [input.ts]
for (; b;) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (; b;) { for (var i = 0; ; i< 10) { foo(); } }
