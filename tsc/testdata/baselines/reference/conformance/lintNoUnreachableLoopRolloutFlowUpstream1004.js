//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1004.ts] ////

//// [input.ts]
for (; b < foo; ) for (; ; c) if (foo) break;

//// [input.ts]
for (; b < foo; ) for (; ; c) if (foo) break;
