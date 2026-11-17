//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1172.ts] ////

//// [input.ts]
for (var a in b) for (; ; c) if (foo) break;

//// [input.ts]
for (var a in b) for (; ; c) if (foo) break;
