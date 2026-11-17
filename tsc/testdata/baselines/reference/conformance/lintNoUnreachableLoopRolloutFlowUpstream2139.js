//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2139.ts] ////

//// [input.ts]
for (var a of f(b)) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (var a of f(b)) { for (; ; c) if (foo) break; break; }
