//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableRolloutFlowUpstream517.ts] ////

//// [input.ts]
function foo() { try { bar(); return; } catch (err) { return err; } }

//// [input.ts]
function foo() { try { bar(); return; } catch (err) { return err; } }
