//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1617.ts] ////

//// [input.ts]
for (a; ; c) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a; ; c) { for (; ; c) if (foo) break; break; }
