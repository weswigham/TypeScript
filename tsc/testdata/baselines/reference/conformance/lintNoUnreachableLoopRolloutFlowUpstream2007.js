//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2007.ts] ////

//// [input.ts]
for (let a in f(b)) { foo(); break; }

//// [input.ts]
for (let a in f(b)) { foo(); break; }
