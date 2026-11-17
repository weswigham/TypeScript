//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream998.ts] ////

//// [input.ts]
for (; b < foo; ) (() => a)();

//// [input.ts]
for (; b < foo; ) (() => a)();
