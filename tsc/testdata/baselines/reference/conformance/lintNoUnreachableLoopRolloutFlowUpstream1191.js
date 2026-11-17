//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1191.ts] ////

//// [input.ts]
for (let a in f(b)) { continue; break; }

//// [input.ts]
for (let a in f(b)) { continue; break; }
