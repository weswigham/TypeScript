//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2081.ts] ////

//// [input.ts]
for (a of f(b)) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (a of f(b)) { for (; ; c) if (foo) break; break; }
