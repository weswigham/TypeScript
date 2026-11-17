//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1522.ts] ////

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { try { return bar(); } catch (e) { break; } } }

//// [input.ts]
function someFunc() { for (var i = 0; i < a.length; i++) { try { return bar(); } catch (e) { break; } } }
