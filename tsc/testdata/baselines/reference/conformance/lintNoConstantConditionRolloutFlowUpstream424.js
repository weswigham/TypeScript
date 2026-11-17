//// [tests/cases/conformance/lint/rules/no-constant-condition/lintNoConstantConditionRolloutFlowUpstream424.ts] ////

//// [input.ts]
function foo() {while (true) {const bar = function*() {while (true) {yield;}}}}

//// [input.ts]
function foo() {while (true) {const bar = function*() {while (true) {yield;}}}}
