//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1256.ts] ////

//// [input.ts]
for (a of f(b)) for (; ; c) if (foo) break;

//// [input.ts]
for (a of f(b)) for (; ; c) if (foo) break;
