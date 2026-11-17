//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1577.ts] ////

//// [input.ts]
for (; b < foo; c++) { switch (foo) { default: throw err; } }

//// [input.ts]
for (; b < foo; c++) { switch (foo) { default: throw err; } }
