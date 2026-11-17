//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1312.ts] ////

//// [input.ts]
for (var a of f(b)) for (; ; c) if (foo) break;

//// [input.ts]
for (var a of f(b)) for (; ; c) if (foo) break;
