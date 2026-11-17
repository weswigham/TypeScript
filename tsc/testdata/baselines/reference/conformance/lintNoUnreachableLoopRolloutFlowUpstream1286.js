//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1286.ts] ////

//// [input.ts]
for ({ a, b } of c) while (true) if (foo) break;

//// [input.ts]
for ({ a, b } of c) while (true) if (foo) break;
