//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream970.ts] ////

//// [input.ts]
for (; b;) (() => a)();

//// [input.ts]
for (; b;) (() => a)();
