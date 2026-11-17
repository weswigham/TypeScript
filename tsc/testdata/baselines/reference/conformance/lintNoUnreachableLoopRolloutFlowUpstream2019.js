//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2019.ts] ////

//// [input.ts]
for (let a in f(b)) { while (a); break; }

//// [input.ts]
for (let a in f(b)) { while (a); break; }
