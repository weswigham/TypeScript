//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1307.ts] ////

//// [input.ts]
for (var a of f(b)) { (() => a)() }

//// [input.ts]
for (var a of f(b)) { (() => a)() }
