//// [tests/cases/conformance/lint/rules/no-param-reassign/lintNoParamReassignRolloutBindingsRulesParamProps.ts] ////

//// [input.ts]
function task(value) { value.prop = 1; delete value.prop; value.get().prop++; [value.prop] = source; for (value.prop of source) {} }

//// [input.ts]
function task(value) { value.prop = 1; delete value.prop; value.get().prop++; [value.prop] = source; for (value.prop of source) {} }
