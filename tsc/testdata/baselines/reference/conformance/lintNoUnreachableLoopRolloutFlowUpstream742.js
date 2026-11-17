//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream742.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (; b; c) { try { return bar(); } catch (e) {} } }
