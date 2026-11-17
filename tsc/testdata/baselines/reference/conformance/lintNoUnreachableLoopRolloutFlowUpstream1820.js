//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1820.ts] ////

//// [input.ts]
for (; b < foo; ) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (; b < foo; ) { for (; ; c) if (foo) break; break; }
