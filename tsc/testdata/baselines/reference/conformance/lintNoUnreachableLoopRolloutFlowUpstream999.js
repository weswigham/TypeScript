//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream999.ts] ////

//// [input.ts]
for (; b < foo; ) { (() => a)() }

//// [input.ts]
for (; b < foo; ) { (() => a)() }
