//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream891.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) for (; b;);

//// [input.ts]
for (a = 0; b < foo; ) for (; b;);
