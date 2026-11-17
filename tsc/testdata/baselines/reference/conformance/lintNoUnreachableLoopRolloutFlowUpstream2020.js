//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2020.ts] ////

//// [input.ts]
for (let a in f(b)) { do ; while (a) break; }

//// [input.ts]
for (let a in f(b)) { do ; while (a) break; }
