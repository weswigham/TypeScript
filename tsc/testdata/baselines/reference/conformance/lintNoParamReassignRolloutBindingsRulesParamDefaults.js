//// [tests/cases/conformance/lint/rules/no-param-reassign/lintNoParamReassignRolloutBindingsRulesParamDefaults.ts] ////

//// [input.ts]
function task(value = 1) { value = 2; value++; value.prop = 3; }

//// [input.ts]
function task(value = 1) { value = 2; value++; value.prop = 3; }
