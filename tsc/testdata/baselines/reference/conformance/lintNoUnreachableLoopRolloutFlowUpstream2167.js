//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2167.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { for (; b;); break; } }

//// [input.ts]
async function foo() { for await (const a of b) { for (; b;); break; } }
