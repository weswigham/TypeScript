//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1146.ts] ////

//// [input.ts]
for (a in f(b)) while (true) if (foo) break;

//// [input.ts]
for (a in f(b)) while (true) if (foo) break;
