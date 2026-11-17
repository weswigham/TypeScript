//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1501.ts] ////

//// [input.ts]
for (a; b; c) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a; b; c) { for (; ; c) if (foo) break; break; }
