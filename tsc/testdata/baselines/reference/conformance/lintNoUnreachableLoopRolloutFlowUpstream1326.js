//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1326.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { continue; } return; } }

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { continue; } return; } }
