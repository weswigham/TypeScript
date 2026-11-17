//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2052.ts] ////

//// [input.ts]
for (a of b) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a of b) { for (; ; c) if (foo) break; break; }
