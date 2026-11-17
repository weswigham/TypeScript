//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1414.ts] ////

//// [input.ts]
while (a && b) { for (; ; c) if (foo) break; break; }

//// [input.ts]
while (a && b) { for (; ; c) if (foo) break; break; }
