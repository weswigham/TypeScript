//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1306.ts] ////

//// [input.ts]
for (var a of f(b)) (() => a)();

//// [input.ts]
for (var a of f(b)) (() => a)();
