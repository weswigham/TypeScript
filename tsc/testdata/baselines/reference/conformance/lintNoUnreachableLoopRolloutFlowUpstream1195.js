//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1195.ts] ////

//// [input.ts]
for (let a in f(b)) { (() => a)() }

//// [input.ts]
for (let a in f(b)) { (() => a)() }
