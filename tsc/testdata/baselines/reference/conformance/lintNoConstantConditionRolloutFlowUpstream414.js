//// [tests/cases/conformance/lint/rules/no-constant-condition/lintNoConstantConditionRolloutFlowUpstream414.ts] ////

//// [input.ts]
function* foo(){while(true){yield 'foo';} while(true) {}}

//// [input.ts]
function* foo(){while(true){yield 'foo';} while(true) {}}
