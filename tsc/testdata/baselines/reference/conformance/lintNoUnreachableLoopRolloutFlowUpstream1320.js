//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1320.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { bar(); } }

//// [input.ts]
async function foo() { for await (const a of b) { bar(); } }
