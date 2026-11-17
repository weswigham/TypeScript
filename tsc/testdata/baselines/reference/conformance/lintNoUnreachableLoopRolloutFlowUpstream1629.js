//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1629.ts] ////

//// [input.ts]
for (a = 0; ; c++) { throw err; }

//// [input.ts]
for (a = 0; ; c++) { throw err; }
