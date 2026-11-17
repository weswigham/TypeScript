//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2023.ts] ////

//// [input.ts]
for (let a in f(b)) { for (; ; c) if (foo) break; break; }

//// [input.ts]
for (let a in f(b)) { for (; ; c) if (foo) break; break; }
