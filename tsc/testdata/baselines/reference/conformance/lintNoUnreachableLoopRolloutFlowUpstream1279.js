//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1279.ts] ////

//// [input.ts]
for ({ a, b } of c) { (() => a)() }

//// [input.ts]
for ({ a, b } of c) { (() => a)() }
