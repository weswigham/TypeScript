//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1329.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
async function foo() { for await (const a of b) { switch (foo) { case 1: continue; default: return; } throw err; } }
