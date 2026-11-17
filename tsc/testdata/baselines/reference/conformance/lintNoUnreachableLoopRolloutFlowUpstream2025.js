//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2025.ts] ////

//// [input.ts]
for (let a in f(b)) { for (a in b); break; }

//// [input.ts]
for (let a in f(b)) { for (a in b); break; }
