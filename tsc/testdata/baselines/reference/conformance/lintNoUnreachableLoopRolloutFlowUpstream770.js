//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream770.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { try { return bar(); } catch (e) {} } }
