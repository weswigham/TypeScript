//// [tests/cases/conformance/lint/rules/no-constant-condition/lintNoConstantConditionRolloutFlowUpstream282.ts] ////

//// [input.ts]
function* foo() { for (let x = yield; x < 10; x++) {yield;}yield;}

//// [input.ts]
function* foo() { for (let x = yield; x < 10; x++) {yield;}yield;}
