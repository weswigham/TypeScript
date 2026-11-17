//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1733.ts] ////

//// [input.ts]
for (; ; c) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (; ; c) { for (; ; c) if (foo) break; break; }
