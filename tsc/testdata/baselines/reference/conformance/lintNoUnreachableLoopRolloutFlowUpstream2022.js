//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2022.ts] ////

//// [input.ts]
for (let a in f(b)) { for (; b;); break; }

//// [input.ts]
for (let a in f(b)) { for (; b;); break; }
