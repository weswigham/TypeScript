//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2110.ts] ////

//// [input.ts]
for ({ a, b } of c) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for ({ a, b } of c) { for (; ; c) if (foo) break; break; }
