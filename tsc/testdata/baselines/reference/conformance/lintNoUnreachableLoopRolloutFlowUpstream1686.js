//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1686.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) throw err;

//// [input.ts]
for (a = 0; b < foo; ) throw err;
