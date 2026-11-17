//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2008.ts] ////

//// [input.ts]
for (let a in f(b)) { break; foo(); }

//// [input.ts]
for (let a in f(b)) { break; foo(); }
