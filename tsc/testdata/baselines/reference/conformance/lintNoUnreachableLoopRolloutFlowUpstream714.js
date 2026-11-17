//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream714.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { try { return bar(); } catch (e) {} } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { try { return bar(); } catch (e) {} } }
