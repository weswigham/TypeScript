//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1144.ts] ////

//// [input.ts]
for (a in f(b)) for (; ; c) if (foo) break;

//// [input.ts]
for (a in f(b)) for (; ; c) if (foo) break;
