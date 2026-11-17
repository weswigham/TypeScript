//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream966.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (; b;) { try { return bar(); } catch (e) {} } }
