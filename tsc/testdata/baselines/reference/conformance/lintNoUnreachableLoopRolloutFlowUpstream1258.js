//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1258.ts] ////

//// [input.ts]
for (a of f(b)) while (true) if (foo) break;

//// [input.ts]
for (a of f(b)) while (true) if (foo) break;
