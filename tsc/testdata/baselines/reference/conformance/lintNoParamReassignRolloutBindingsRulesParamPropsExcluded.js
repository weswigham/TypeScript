//// [tests/cases/conformance/lint/rules/no-param-reassign/lintNoParamReassignRolloutBindingsRulesParamPropsExcluded.ts] ////

//// [input.ts]
function task(value) { cache(value.prop).prop = 1; cache[value.prop] = 1; (value ? [] : [])[0] = 1; ({[value]: other} = source); }

//// [input.ts]
function task(value) { cache(value.prop).prop = 1; cache[value.prop] = 1; (value ? [] : [])[0] = 1; ({[value]: other} = source); }
