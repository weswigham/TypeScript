//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1689.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { break; foo(); }

//// [input.ts]
for (a = 0; b < foo; ) { break; foo(); }
