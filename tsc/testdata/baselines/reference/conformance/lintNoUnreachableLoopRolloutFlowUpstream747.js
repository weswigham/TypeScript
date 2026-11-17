//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream747.ts] ////

//// [input.ts]
for (; b; c) { (() => a)() }

//// [input.ts]
for (; b; c) { (() => a)() }
