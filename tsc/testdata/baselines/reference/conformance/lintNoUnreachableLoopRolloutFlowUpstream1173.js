//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1173.ts] ////

//// [input.ts]
for (var a in b) for (;;) if (foo) break;

//// [input.ts]
for (var a in b) for (;;) if (foo) break;
