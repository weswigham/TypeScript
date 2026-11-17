//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1325.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { bar(); } else { break; } } }

//// [input.ts]
async function foo() { for await (const a of b) { if (foo) { bar(); } else { break; } } }
