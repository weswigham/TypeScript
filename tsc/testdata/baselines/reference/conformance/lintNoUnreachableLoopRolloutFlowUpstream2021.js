//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2021.ts] ////

//// [input.ts]
for (let a in f(b)) { for (a; b; c); break; }

//// [input.ts]
for (let a in f(b)) { for (a; b; c); break; }
