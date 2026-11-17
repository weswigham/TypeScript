//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2018.ts] ////

//// [input.ts]
for (let a in f(b)) { (() => a)(); break; }

//// [input.ts]
for (let a in f(b)) { (() => a)(); break; }
