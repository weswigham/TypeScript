//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2165.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { do ; while (a) break; } }

//// [input.ts]
async function foo() { for await (const a of b) { do ; while (a) break; } }
