//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1331.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { continue; break; } }

//// [input.ts]
async function foo() { for await (const a of b) { continue; break; } }
