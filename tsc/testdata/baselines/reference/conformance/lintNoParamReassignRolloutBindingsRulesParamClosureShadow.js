//// [tests/cases/conformance/lint/rules/no-param-reassign/lintNoParamReassignRolloutBindingsRulesParamClosureShadow.ts] ////

//// [input.ts]
function task(value) { function closure() { value = 1; } function shadow(value) { value = 1; } { let value; value = 1; } }

//// [input.ts]
function task(value) { function closure() { value = 1; } function shadow(value) { value = 1; } { let value; value = 1; } }
