//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1635.ts] ////

//// [input.ts]
for (a = 0; ; c++) { switch (foo) { default: throw err; } }

//// [input.ts]
for (a = 0; ; c++) { switch (foo) { default: throw err; } }
