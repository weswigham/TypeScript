//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream802.ts] ////

//// [input.ts]
for (a; ; c) (() => a)();

//// [input.ts]
for (a; ; c) (() => a)();
