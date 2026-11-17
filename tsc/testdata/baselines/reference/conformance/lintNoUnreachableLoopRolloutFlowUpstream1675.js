//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1675.ts] ////

//// [input.ts]
for (a; b;) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a; b;) { for (; ; c) if (foo) break; break; }
