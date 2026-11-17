//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1174.ts] ////

//// [input.ts]
for (var a in b) while (true) if (foo) break;

//// [input.ts]
for (var a in b) while (true) if (foo) break;
