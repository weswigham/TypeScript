//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2016.ts] ////

//// [input.ts]
for (let a in f(b)) { break; continue; }

//// [input.ts]
for (let a in f(b)) { break; continue; }
