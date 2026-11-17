//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1327.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: return; } } }

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: return; } } }
