//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1139.ts] ////

//// [input.ts]
for (a in f(b)) { (() => a)() }

//// [input.ts]
for (a in f(b)) { (() => a)() }
