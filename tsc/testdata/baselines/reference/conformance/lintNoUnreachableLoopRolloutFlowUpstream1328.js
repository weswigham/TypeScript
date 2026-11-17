//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1328.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: break; default: return; } } }
