//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1314.ts] ////

//// [input.ts]
for (var a of f(b)) while (true) if (foo) break;

//// [input.ts]
for (var a of f(b)) while (true) if (foo) break;
