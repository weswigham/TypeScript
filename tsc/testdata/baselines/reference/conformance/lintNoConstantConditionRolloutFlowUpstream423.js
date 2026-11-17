//// [tests/cases/conformance/lint/rules/no-constant-condition/lintNoConstantConditionRolloutFlowUpstream423.ts] ////

//// [input.ts]
function foo() {while (true) {function* bar() {while (true) {yield;}}}}

//// [input.ts]
function foo() {while (true) {function* bar() {while (true) {yield;}}}}
