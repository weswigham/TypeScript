//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream607.ts] ////

//// [input.ts]
while (a && b) { (() => a)() }

//// [input.ts]
while (a && b) { (() => a)() }
