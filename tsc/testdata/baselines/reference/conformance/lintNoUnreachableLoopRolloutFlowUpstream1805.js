//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1805.ts] ////

//// [input.ts]
for (; b < foo; ) { break; foo(); }

//// [input.ts]
for (; b < foo; ) { break; foo(); }
