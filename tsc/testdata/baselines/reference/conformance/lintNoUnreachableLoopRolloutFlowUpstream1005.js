//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1005.ts] ////

//// [input.ts]
for (; b < foo; ) for (;;) if (foo) break;

//// [input.ts]
for (; b < foo; ) for (;;) if (foo) break;
