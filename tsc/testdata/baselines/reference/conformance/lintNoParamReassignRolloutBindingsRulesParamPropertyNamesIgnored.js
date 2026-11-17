//// [tests/cases/conformance/lint/rules/no-param-reassign/lintNoParamReassignRolloutBindingsRulesParamPropertyNamesIgnored.ts] ////

//// [input.ts]
function task(value) { value.prop = 1; value = 1; }

//// [input.ts]
function task(value) { value.prop = 1; value = 1; }
