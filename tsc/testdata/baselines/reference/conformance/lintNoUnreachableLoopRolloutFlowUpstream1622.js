//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1622.ts] ////

//// [input.ts]
for (a; ; c) { for (var i = 0; ; i< 10) { foo(); } }

//// [input.ts]
for (a; ; c) { for (var i = 0; ; i< 10) { foo(); } }
