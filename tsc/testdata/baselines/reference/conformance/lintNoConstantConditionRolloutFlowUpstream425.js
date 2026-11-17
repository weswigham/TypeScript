//// [tests/cases/conformance/lint/rules/no-constant-condition/lintNoConstantConditionRolloutFlowUpstream425.ts] ////

//// [input.ts]
function* foo() { for (let foo = 1 + 2 + 3 + (yield); true; baz) {}}

//// [input.ts]
function* foo() { for (let foo = 1 + 2 + 3 + (yield); true; baz) {}}
