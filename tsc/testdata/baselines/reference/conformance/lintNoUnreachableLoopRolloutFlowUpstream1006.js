//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1006.ts] ////

//// [input.ts]
for (; b < foo; ) while (true) if (foo) break;

//// [input.ts]
for (; b < foo; ) while (true) if (foo) break;
