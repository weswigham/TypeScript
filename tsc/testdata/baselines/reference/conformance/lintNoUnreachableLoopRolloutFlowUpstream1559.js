//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1559.ts] ////

//// [input.ts]
for (; b; c) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (; b; c) { for (; ; c) if (foo) break; break; }
