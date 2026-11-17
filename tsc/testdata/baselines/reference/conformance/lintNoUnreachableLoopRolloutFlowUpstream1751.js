//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1751.ts] ////

//// [input.ts]
for (; ; c++) { switch (foo) { default: throw err; } }

//// [input.ts]
for (; ; c++) { switch (foo) { default: throw err; } }
