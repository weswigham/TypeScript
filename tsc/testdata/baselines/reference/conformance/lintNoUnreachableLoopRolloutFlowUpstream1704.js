//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1704.ts] ////

//// [input.ts]
for (a = 0; b < foo; ) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a = 0; b < foo; ) { for (; ; c) if (foo) break; break; }
