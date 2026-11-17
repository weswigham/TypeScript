//// [tests/cases/conformance/lint/rules/no-constant-condition/lintNoConstantConditionRolloutFlowUpstream281.ts] ////

//// [input.ts]
function* foo() {while (true) {function* foo() {yield;}yield;}}

//// [input.ts]
function* foo() {while (true) {function* foo() {yield;}yield;}}
