//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream994.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { try { return bar(); } catch (e) {} } }
