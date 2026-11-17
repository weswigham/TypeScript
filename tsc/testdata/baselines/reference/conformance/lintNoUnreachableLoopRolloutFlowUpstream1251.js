//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1251.ts] ////

//// [input.ts]
for (a of f(b)) { (() => a)() }

//// [input.ts]
for (a of f(b)) { (() => a)() }
