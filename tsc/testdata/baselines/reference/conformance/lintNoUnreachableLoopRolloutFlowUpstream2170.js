//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2170.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { for (a in b); break; } }

//// [input.ts]
async function foo() { for await (const a of b) { for (a in b); break; } }
