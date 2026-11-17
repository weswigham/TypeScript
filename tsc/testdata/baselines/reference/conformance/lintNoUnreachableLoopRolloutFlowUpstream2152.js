//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2152.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { foo(); break; } }

//// [input.ts]
async function foo() { for await (const a of b) { foo(); break; } }
