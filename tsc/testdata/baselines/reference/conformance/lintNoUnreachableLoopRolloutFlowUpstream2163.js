//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2163.ts] ////

//// [input.ts]
async function foo() { for await (const a of b) { (() => a)(); break; } }

//// [input.ts]
async function foo() { for await (const a of b) { (() => a)(); break; } }
